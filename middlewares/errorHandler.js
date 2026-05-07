/**
 * Middleware centralisé de gestion des erreurs
 * Gère tous les types d'erreurs de l'application
 */
class ErrorHandler {
  
  /**
   * Gère les erreurs Mongoose
   */
  static handleMongooseError(err) {
    // Erreur de validation
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Erreur de validation',
        details: messages
      };
    }
    
    // Duplication (index unique)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return {
        statusCode: 400,
        code: 'DUPLICATE_ERROR',
        message: `La valeur '${err.keyValue[field]}' existe déjà pour le champ '${field}'`,
        details: [{ field, value: err.keyValue[field] }]
      };
    }
    
    // Cast Error (ID invalide)
    if (err.name === 'CastError') {
      return {
        statusCode: 400,
        code: 'INVALID_ID',
        message: `ID invalide: ${err.value}`,
        details: [{ field: err.path, value: err.value }]
      };
    }
    
    return null;
  }
  
  /**
   * Gère les erreurs JWT
   */
  static handleJWTError(err) {
    if (err.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        code: 'INVALID_TOKEN',
        message: 'Token d\'authentification invalide'
      };
    }
    
    if (err.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Token d\'authentification expiré'
      };
    }
    
    return null;
  }
  
  /**
   * Middleware principal de gestion des erreurs
   */
  static handleError(err, req, res, next) {
    // Log de l'erreur (masque les données sensibles en prod)
    if (process.env.NODE_ENV === 'development') {
      console.error('🔥 ERREUR:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
    } else {
      // En production, log minimal
      console.error('❌ Erreur:', err.message);
    }
    
    // Gestion des erreurs Mongoose
    let mongooseError = this.handleMongooseError(err);
    if (mongooseError) {
      return res.status(mongooseError.statusCode).json({
        success: false,
        error: {
          code: mongooseError.code,
          message: mongooseError.message,
          details: mongooseError.details,
          status: mongooseError.statusCode,
          timestamp: new Date().toISOString(),
          path: req.url
        }
      });
    }
    
    // Gestion des erreurs JWT
    let jwtError = this.handleJWTError(err);
    if (jwtError) {
      return res.status(jwtError.statusCode).json({
        success: false,
        error: {
          code: jwtError.code,
          message: jwtError.message,
          status: jwtError.statusCode,
          timestamp: new Date().toISOString(),
          path: req.url
        }
      });
    }
    
    // Erreurs personnalisées de l'application
    if (err.statusCode && err.code) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          status: err.statusCode,
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
      });
    }
    
    // Erreur serveur par défaut
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message || 'Erreur inattendue';
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: message,
        status: statusCode,
        timestamp: new Date().toISOString(),
        path: req.url,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err.stack,
          originalError: err.toString()
        })
      }
    });
  }
  
  /**
   * Middleware pour les routes non trouvées
   */
  static notFound(req, res, next) {
    const error = new Error(`Route non trouvée: ${req.originalUrl}`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    next(error);
  }
  
  /**
   * Middleware pour capturer les erreurs async
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorHandler;