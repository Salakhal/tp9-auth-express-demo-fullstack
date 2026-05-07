const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Schéma utilisateur avec validation et sécurité renforcée
 * Implémente:
 * - Hachage automatique des mots de passe
 * - Validation des champs
 * - Méthodes d'instance sécurisées
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Cache le mot de passe par défaut
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: 'Le rôle {VALUE} n\'est pas valide'
    },
    default: 'user'
  },
  refreshToken: {
    type: String,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Gère automatiquement createdAt et updatedAt
  toJSON: { virtuals: true, transform: this.transformDoc },
  toObject: { virtuals: true }
});

// Transforme le document pour l'API (masque les données sensibles)
userSchema.methods.transformDoc = function(doc, ret) {
  delete ret.password;
  delete ret.refreshToken;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpires;
  delete ret.__v;
  return ret;
};

/**
 * Middleware pre-save: Hachage du mot de passe
 * S'exécute automatiquement avant chaque sauvegarde
 */
userSchema.pre('save', async function(next) {
  // Ne hache que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    // Facteur de coût: 12 est un bon équilibre sécurité/performance
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Met à jour passwordChangedAt si ce n'est pas un nouveau document
    if (!this.isNew) {
      this.passwordChangedAt = Date.now();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware pre-update: Met à jour updatedAt
 */
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

/**
 * Méthode: Compare un mot de passe avec le hash stocké
 * @param {string} candidatePassword - Mot de passe à vérifier
 * @returns {Promise<boolean>} - True si correspond
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Méthode: Vérifie si le mot de passe a été changé après un token JWT
 * @param {number} JWTTimestamp - Timestamp du JWT (en secondes)
 * @returns {boolean} - True si le mot de passe a été changé après le token
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Méthode: Vérifie si le compte est verrouillé
 * @returns {boolean} - True si le compte est verrouillé
 */
userSchema.methods.isLocked = function() {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
};

/**
 * Méthode: Incrémente les tentatives de connexion
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Réinitialise si le verrouillage a expiré
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Incrémente les tentatives
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Verrouille après 5 tentatives
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minutes
  }
  
  return await this.updateOne(updates);
};

/**
 * Méthode: Réinitialise les tentatives de connexion
 */
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Index pour optimiser les requêtes fréquentes
 */
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;