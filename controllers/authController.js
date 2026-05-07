const User = require('../models/User');
const TokenService = require('../utils/tokenUtils');
const SecurityUtils = require('../utils/security');
const ErrorHandler = require('../middlewares/errorHandler');

/**
 * Contrôleur d'authentification
 * Gère toutes les opérations d'authentification (sessions + JWT)
 */
class AuthController {
  
  // ==================== SESSIONS ====================
  
  /**
   * Inscription avec session
   */
  static registerWithSession = ErrorHandler.asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Cet email ou nom d\'utilisateur est déjà utilisé',
          status: 409
        }
      });
    }
    
    // Crée l'utilisateur
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Crée la session
    req.session.userId = user._id;
    req.session.userRole = user.role;
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: user.transformDoc(),
        sessionId: req.session.id
      }
    });
  });
  
  /**
   * Connexion avec session
   */
  static loginWithSession = ErrorHandler.asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Récupère l'utilisateur avec le mot de passe
    const user = await User.findOne({ email, isActive: true }).select('+password +loginAttempts +lockUntil');
    
    // Vérifie si l'utilisateur existe
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          status: 401
        }
      });
    }
    
    // Vérifie si le compte est verrouillé
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Compte verrouillé. Réessayez dans ${lockTimeRemaining} minutes`,
          status: 423
        }
      });
    }
    
    // Vérifie le mot de passe
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          status: 401
        }
      });
    }
    
    // Réinitialise les tentatives et met à jour lastLogin
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    await user.save();
    
    // Crée la session
    req.session.userId = user._id;
    req.session.userRole = user.role;
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.transformDoc(),
        sessionId: req.session.id
      }
    });
  });
  
  /**
   * Déconnexion avec session
   */
  static logoutWithSession = ErrorHandler.asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'LOGOUT_ERROR',
            message: 'Erreur lors de la déconnexion',
            status: 500
          }
        });
      }
      
      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });
    });
  });
  
  // ==================== JWT ====================
  
  /**
   * Inscription avec JWT
   */
  static registerWithJWT = ErrorHandler.asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Cet email ou nom d\'utilisateur est déjà utilisé',
          status: 409
        }
      });
    }
    
    // Crée l'utilisateur
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Génère les tokens
    const accessToken = TokenService.generateAccessToken(user._id, user.role);
    const refreshToken = TokenService.generateRefreshToken(user._id);
    
    // Sauvegarde le refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Définit le cookie HTTP-only pour le refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/api/auth/refresh-token' // Restreint le cookie à cette route
    });
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: user.transformDoc(),
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRY
      }
    });
  });
  
  /**
   * Connexion avec JWT
   */
  static loginWithJWT = ErrorHandler.asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Récupère l'utilisateur
    const user = await User.findOne({ email, isActive: true }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          status: 401
        }
      });
    }
    
    // Vérifie si le compte est verrouillé
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Compte verrouillé. Réessayez dans ${lockTimeRemaining} minutes`,
          status: 423
        }
      });
    }
    
    // Vérifie le mot de passe
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          status: 401
        }
      });
    }
    
    // Vérifie si le mot de passe a changé après un token
    if (user.changedPasswordAfter(req.user?.iat)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGED',
          message: 'Mot de passe récemment modifié, veuillez vous reconnecter',
          status: 401
        }
      });
    }
    
    // Réinitialise les tentatives et met à jour lastLogin
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    
    // Génère les tokens
    const accessToken = TokenService.generateAccessToken(user._id, user.role);
    const refreshToken = TokenService.generateRefreshToken(user._id);
    
    // Sauvegarde le refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Définit le cookie HTTP-only
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.transformDoc(),
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRY
      }
    });
  });
  
  /**
   * Rafraîchissement du token d'accès
   */
  static refreshToken = ErrorHandler.asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token manquant',
          status: 401
        }
      });
    }
    
    // Vérifie le refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);
    
    // Trouve l'utilisateur avec ce refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      isActive: true
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token invalide ou expiré',
          status: 401
        }
      });
    }
    
    // Génère un nouveau token d'accès
    const accessToken = TokenService.generateAccessToken(user._id, user.role);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRY
      }
    });
  });
  
  /**
   * Déconnexion avec JWT
   */
  static logoutWithJWT = ErrorHandler.asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Invalide le refresh token
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }
    
    // Supprime le cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });
    
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  });
  
  // ==================== PROFIL ====================
  
  /**
   * Récupère le profil utilisateur (Session)
   */
  static getProfileWithSession = ErrorHandler.asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Utilisateur non trouvé',
          status: 404
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.transformDoc()
    });
  });
  
  /**
   * Récupère le profil utilisateur (JWT)
   */
  static getProfileWithJWT = ErrorHandler.asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Utilisateur non trouvé',
          status: 404
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.transformDoc()
    });
  });
  
  /**
   * Met à jour le profil utilisateur
   */
  static updateProfile = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.session?.userId;
    const { username, email } = req.body;
    
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = SecurityUtils.sanitizeEmail(email);
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Profil mis à jour',
      data: user.transformDoc()
    });
  });
  
  /**
   * Change le mot de passe
   */
  static changePassword = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.session?.userId;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId).select('+password');
    
    // Vérifie le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Mot de passe actuel incorrect',
          status: 401
        }
      });
    }
    
    // Valide le nouveau mot de passe
    const passwordValidation = SecurityUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isStrong) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Mot de passe trop faible: ' + passwordValidation.message,
          status: 400
        }
      });
    }
    
    // Met à jour le mot de passe
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  });
}

module.exports = AuthController;