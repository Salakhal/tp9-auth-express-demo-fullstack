const TokenService = require('../utils/tokenUtils');
const User = require('../models/User');

/**
 * Middlewares d'authentification et d'autorisation
 * Supporte deux méthodes: Sessions et JWT
 */
class AuthMiddleware {
  
  // ==================== SESSIONS ====================
  
  /**
   * Vérifie si l'utilisateur est authentifié via session
   */
  static isAuthenticatedWithSession(req, res, next) {
    if (req.session && req.session.userId) {
      return next();
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Veuillez vous connecter pour accéder à cette ressource',
        status: 401
      }
    });
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié via JWT
   */
  static isAuthenticatedWithJWT(req, res, next) {
    try {
      // Récupère le token du header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Token d\'authentification manquant ou format invalide',
            status: 401
          }
        });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = TokenService.verifyAccessToken(token);
      
      // Ajoute l'utilisateur décodé à la requête
      req.user = decoded;
      next();
      
    } catch (error) {
      let errorCode = 'INVALID_TOKEN';
      let statusCode = 401;
      
      if (error.message === 'Token expiré') {
        errorCode = 'TOKEN_EXPIRED';
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
          status: statusCode
        }
      });
    }
  }
  
  // ==================== AUTORISATION ====================
  
  /**
   * Middleware d'autorisation par rôle (Sessions)
   * @param {string[]} roles - Rôles autorisés
   */
  static authorizeWithSession(roles) {
    return (req, res, next) => {
      if (!req.session || !req.session.userRole) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'Session invalide ou expirée',
            status: 401
          }
        });
      }
      
      if (!roles.includes(req.session.userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Accès interdit - Privilèges insuffisants',
            status: 403,
            requiredRoles: roles,
            userRole: req.session.userRole
          }
        });
      }
      
      next();
    };
  }
  
  /**
   * Middleware d'autorisation par rôle (JWT)
   * @param {string[]} roles - Rôles autorisés
   */
  static authorizeWithJWT(roles) {
    return (req, res, next) => {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_USER_CONTEXT',
            message: 'Utilisateur non authentifié',
            status: 401
          }
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_RIGHTS',
            message: 'Accès interdit - Rôle insuffisant',
            status: 403,
            requiredRoles: roles,
            userRole: req.user.role
          }
        });
      }
      
      next();
    };
  }
  
  // ==================== MIDDLEWARES SPÉCIFIQUES ====================
  
  /**
   * Vérifie si l'utilisateur a accès à la ressource demandée
   * (pour les routes de type /users/:id)
   */
  static requireOwnershipOrAdmin(req, res, next) {
    const requestedUserId = req.params.id || req.params.userId;
    const authenticatedUserId = req.user?.id || req.session?.userId;
    const userRole = req.user?.role || req.session?.userRole;
    
    // Admin a accès à tout
    if (userRole === 'admin') {
      return next();
    }
    
    // L'utilisateur ne peut accéder qu'à ses propres ressources
    if (requestedUserId === authenticatedUserId) {
      return next();
    }
    
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Vous ne pouvez accéder qu\'à vos propres ressources',
        status: 403
      }
    });
  }
  
  /**
   * Limite l'accès aux routes d'administration
   */
  static requireAdmin(req, res, next) {
    const userRole = req.user?.role || req.session?.userRole;
    
    if (userRole === 'admin') {
      return next();
    }
    
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Accès réservé aux administrateurs',
        status: 403
      }
    });
  }
}

module.exports = AuthMiddleware;