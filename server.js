
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

//  CORRECTION: Déclarer app AVANT de l'utiliser
const app = express();
const PORT = process.env.PORT || 3000;

// Maintenant c'est correct
app.use(express.static('public'));



// ==================== MODÈLE UTILISATEUR ====================
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshToken: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 15 * 60 * 1000;
    }
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

const User = mongoose.model('User', userSchema);

// ==================== MIDDLEWARES DE SÉCURITÉ ====================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

// ==================== SESSION STORE MÉMOIRE ====================

const MemoryStore = require('./config/redis').MemoryStore;

app.use(session({
  store: new MemoryStore(),
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
  rolling: true
}));

// ==================== RATE LIMITING ====================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Trop de tentatives, réessayez dans 15 minutes' }
});

// ==================== MIDDLEWARES AUTH ====================

const isAuthenticatedSession = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ success: false, message: 'Veuillez vous connecter' });
};

const isAuthenticatedJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

// ==================== CONTROLLERS ====================

// SESSIONS
const registerSession = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Utilisateur déjà existant' });
    }
    
    const user = await User.create({ username, email, password });
    req.session.userId = user._id;
    req.session.userRole = user.role;
    
    res.status(201).json({ 
      success: true, 
      message: 'Inscription réussie',
      data: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginSession = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    if (user.isLocked()) {
      return res.status(423).json({ success: false, message: 'Compte verrouillé, réessayez plus tard' });
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    await user.save();
    
    req.session.userId = user._id;
    req.session.userRole = user.role;
    
    res.json({ 
      success: true, 
      message: 'Connexion réussie',
      data: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logoutSession = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion' });
    res.clearCookie('sessionId');
    res.json({ success: true, message: 'Déconnexion réussie' });
  });
};

const profileSession = async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  res.json({ success: true, data: user });
};

// JWT
const registerJWT = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Utilisateur déjà existant' });
    }
    
    const user = await User.create({ username, email, password });
    const accessToken = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user._id }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: '7d' }
    );
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ 
      success: true, 
      accessToken,
      data: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginJWT = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    if (user.isLocked()) {
      return res.status(423).json({ success: false, message: 'Compte verrouillé' });
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, accessToken, data: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token manquant' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }
    
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token expiré' });
  }
};

const logoutJWT = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Déconnexion réussie' });
};

const profileJWT = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  res.json({ success: true, data: user });
};

// ==================== ROUTES ====================

// Sessions
app.post('/api/auth/register-session', registerSession);
app.post('/api/auth/login-session', authLimiter, loginSession);
app.get('/api/auth/logout-session', isAuthenticatedSession, logoutSession);
app.get('/api/auth/profile-session', isAuthenticatedSession, profileSession);

// JWT
app.post('/api/auth/register-jwt', registerJWT);
app.post('/api/auth/login-jwt', authLimiter, loginJWT);
app.get('/api/auth/refresh-token', refreshToken);
app.get('/api/auth/logout-jwt', isAuthenticatedJWT, logoutJWT);
app.get('/api/auth/profile-jwt', isAuthenticatedJWT, profileJWT);

// Admin
app.get('/api/auth/admin-only', isAuthenticatedSession, (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès admin requis' });
  }
  res.json({ success: true, message: 'Zone admin - Session' });
});

app.get('/api/auth/admin-only-jwt', isAuthenticatedJWT, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès admin requis' });
  }
  res.json({ success: true, message: 'Zone admin - JWT' });
});

// Santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Auth Express API',
    version: '1.0.0',
    endpoints: {
      session: { register: 'POST /api/auth/register-session', login: 'POST /api/auth/login-session' },
      jwt: { register: 'POST /api/auth/register-jwt', login: 'POST /api/auth/login-jwt' }
    }
  });
});
// ==================== ROUTE TEMPORAIRE POUR ADMIN ====================
// À SUPPRIMER APRÈS AVOIR CRÉÉ L'ADMIN
app.post('/api/temp/make-admin/:email', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      success: true, 
      message: ` ${user.email} est maintenant administrateur`,
      data: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==================== DÉMARRAGE ====================

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_demo');
    console.log(' MongoDB connecté');
    
    app.listen(PORT, () => {
      console.log(`
     SERVEUR DÉMARRÉ AVEC SUCCÈS                       
   Port: ${PORT}                                            
   URL: http://localhost:${PORT}                            

   Authentification disponible :                         
     • Sessions (MemoryStore)                             
     • JWT avec refresh tokens                            
      `);
    });
  } catch (error) {
    console.error(' Erreur:', error.message);
    console.log('\nVérifiez que MongoDB est installé et démarré');
  }
};

startServer();