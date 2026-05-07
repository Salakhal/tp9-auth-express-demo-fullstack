const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middlewares/auth');
const ValidationMiddleware = require('../middlewares/validation');

// ==================== ROUTES SESSIONS ====================
/**
 * @route   POST /api/auth/register-session
 * @desc    Inscription avec session
 * @access  Public
 */
router.post(
  '/register-session',
  ValidationMiddleware.validateRegistration,
  AuthController.registerWithSession
);

/**
 * @route   POST /api/auth/login-session
 * @desc    Connexion avec session
 * @access  Public
 */
router.post(
  '/login-session',
  ValidationMiddleware.validateLogin,
  AuthController.loginWithSession
);

/**
 * @route   GET /api/auth/logout-session
 * @desc    Déconnexion avec session
 * @access  Private
 */
router.get(
  '/logout-session',
  AuthMiddleware.isAuthenticatedWithSession,
  AuthController.logoutWithSession
);

/**
 * @route   GET /api/auth/profile-session
 * @desc    Récupère le profil (session)
 * @access  Private
 */
router.get(
  '/profile-session',
  AuthMiddleware.isAuthenticatedWithSession,
  AuthController.getProfileWithSession
);

// ==================== ROUTES JWT ====================
/**
 * @route   POST /api/auth/register-jwt
 * @desc    Inscription avec JWT
 * @access  Public
 */
router.post(
  '/register-jwt',
  ValidationMiddleware.validateRegistration,
  AuthController.registerWithJWT
);

/**
 * @route   POST /api/auth/login-jwt
 * @desc    Connexion avec JWT
 * @access  Public
 */
router.post(
  '/login-jwt',
  ValidationMiddleware.validateLogin,
  AuthController.loginWithJWT
);

/**
 * @route   GET /api/auth/refresh-token
 * @desc    Rafraîchit le token d'accès
 * @access  Public (nécessite refresh token dans cookie)
 */
router.get(
  '/refresh-token',
  AuthController.refreshToken
);

/**
 * @route   GET /api/auth/logout-jwt
 * @desc    Déconnexion avec JWT
 * @access  Private
 */
router.get(
  '/logout-jwt',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthController.logoutWithJWT
);

/**
 * @route   GET /api/auth/profile-jwt
 * @desc    Récupère le profil (JWT)
 * @access  Private
 */
router.get(
  '/profile-jwt',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthController.getProfileWithJWT
);

// ==================== ROUTES COMMUNES ====================
/**
 * @route   PUT /api/auth/profile
 * @desc    Met à jour le profil
 * @access  Private
 */
router.put(
  '/profile',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change le mot de passe
 * @access  Private
 */
router.post(
  '/change-password',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthController.changePassword
);

// ==================== ROUTES ADMIN ====================
/**
 * @route   GET /api/auth/admin-only
 * @desc    Route réservée aux admins (session)
 * @access  Private/Admin
 */
router.get(
  '/admin-only',
  AuthMiddleware.isAuthenticatedWithSession,
  AuthMiddleware.authorizeWithSession(['admin']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Bienvenue dans la zone administrateur (session)',
      data: { role: req.session.userRole }
    });
  }
);

/**
 * @route   GET /api/auth/admin-only-jwt
 * @desc    Route réservée aux admins (JWT)
 * @access  Private/Admin
 */
router.get(
  '/admin-only-jwt',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthMiddleware.authorizeWithJWT(['admin']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Bienvenue dans la zone administrateur (JWT)',
      data: { role: req.user.role, userId: req.user.id }
    });
  }
);

/**
 * @route   GET /api/auth/users
 * @desc    Liste tous les utilisateurs (réservé admin)
 * @access  Private/Admin
 */
router.get(
  '/users',
  AuthMiddleware.isAuthenticatedWithJWT,
  AuthMiddleware.requireAdmin,
  async (req, res) => {
    const users = await User.find({}).select('-password -refreshToken');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  }
);

module.exports = router;