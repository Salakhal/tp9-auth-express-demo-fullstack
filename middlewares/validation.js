const SecurityUtils = require('../utils/security');

/**
 * Middlewares de validation des entrées
 */
class ValidationMiddleware {
  
  /**
   * Valide les données d'inscription
   */
  static validateRegistration(req, res, next) {
    const { username, email, password } = req.body;
    const errors = [];
    
    // Validation du nom d'utilisateur
    if (!username || username.length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    if (username && username.length > 30) {
      errors.push('Le nom d\'utilisateur ne peut pas dépasser 30 caractères');
    }
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
    
    // Validation de l'email
    if (!email) {
      errors.push('L\'email est requis');
    }
    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('Email invalide');
    }
    
    // Validation du mot de passe
    const passwordValidation = SecurityUtils.validatePasswordStrength(password);
    if (!passwordValidation.isStrong) {
      errors.push('Mot de passe trop faible: ' + passwordValidation.message);
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erreurs de validation',
          details: errors,
          status: 400
        }
      });
    }
    
    // Nettoie les entrées
    req.body.username = SecurityUtils.sanitizeInput(username);
    req.body.email = SecurityUtils.sanitizeEmail(email);
    
    next();
  }
  
  /**
   * Valide les données de connexion
   */
  static validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = [];
    
    if (!email) {
      errors.push('L\'email est requis');
    }
    if (!password) {
      errors.push('Le mot de passe est requis');
    }
    if (password && password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erreurs de validation',
          details: errors,
          status: 400
        }
      });
    }
    
    if (email) {
      req.body.email = SecurityUtils.sanitizeEmail(email);
    }
    
    next();
  }
  
  /**
   * Valide l'ID MongoDB
   */
  static validateObjectId(req, res, next) {
    const { id } = req.params;
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID invalide',
          status: 400
        }
      });
    }
    
    next();
  }
}

module.exports = ValidationMiddleware;