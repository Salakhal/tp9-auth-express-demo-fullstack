const jwt = require('jsonwebtoken');

/**
 * Utilitaires de gestion des tokens JWT
 * Implémente la génération et validation des access/refresh tokens
 */
class TokenService {
  
  /**
   * Génère un token d'accès (courte durée)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} role - Rôle de l'utilisateur
   * @returns {string} Token JWT
   */
  static generateAccessToken(userId, role) {
    const payload = {
      id: userId,
      role: role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );
  }
  
  /**
   * Génère un token de rafraîchissement (longue durée)
   * @param {string} userId - ID de l'utilisateur
   * @returns {string} Refresh Token JWT
   */
  static generateRefreshToken(userId) {
    const payload = {
      id: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
  }
  
  /**
   * Vérifie et décode un token d'accès
   * @param {string} token - Token JWT
   * @returns {object} Payload décodé
   * @throws {Error} Si token invalide
   */
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifie le type de token
      if (decoded.type !== 'access') {
        throw new Error('Type de token invalide');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token invalide');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      }
      throw error;
    }
  }
  
  /**
   * Vérifie et décode un refresh token
   * @param {string} token - Refresh Token JWT
   * @returns {object} Payload décodé
   * @throws {Error} Si token invalide
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      
      // Vérifie le type de token
      if (decoded.type !== 'refresh') {
        throw new Error('Type de token invalide');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh token invalide');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expiré');
      }
      throw error;
    }
  }
  
  /**
   * Décode un token sans vérification (utile pour le debug)
   * @param {string} token - Token JWT
   * @returns {object|null} Payload décodé
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
  
  /**
   * Vérifie si un token est expiré
   * @param {string} token - Token JWT
   * @returns {boolean} True si expiré
   */
  static isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }
}

module.exports = TokenService;