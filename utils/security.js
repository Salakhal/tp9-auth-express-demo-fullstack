const crypto = require('crypto');

/**
 * Utilitaires de sécurité avancée
 */
class SecurityUtils {
  
  /**
   * Génère un token aléatoire sécurisé
   * @param {number} bytes - Nombre d'octets (défaut: 32)
   * @returns {string} Token hexadécimal
   */
  static generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }
  
  /**
   * Nettoie et valide une adresse email
   * @param {string} email - Email à nettoyer
   * @returns {string} Email nettoyé
   */
  static sanitizeEmail(email) {
    return email.toLowerCase().trim();
  }
  
  /**
   * Échappe les caractères HTML pour prévenir XSS
   * @param {string} input - Chaîne à échapper
   * @returns {string} Chaîne échappée
   */
  static escapeHtml(input) {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /**
   * Masque partiellement un email pour l'affichage
   * @param {string} email - Email à masquer
   * @returns {string} Email masqué
   */
  static maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.slice(0, 2) + '***' + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
  
  /**
   * Valide la force d'un mot de passe
   * @param {string} password - Mot de passe à valider
   * @returns {object} Résultat de validation
   */
  static validatePasswordStrength(password) {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const isStrong = score >= 4;
    
    return {
      isStrong,
      score,
      checks,
      message: isStrong ? 'Mot de passe fort' : 'Mot de passe faible'
    };
  }
  
  /**
   * Nettoie les entrées utilisateur
   * @param {object} data - Données à nettoyer
   * @returns {object} Données nettoyées
   */
  static sanitizeInput(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.escapeHtml(value.trim());
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

module.exports = SecurityUtils;