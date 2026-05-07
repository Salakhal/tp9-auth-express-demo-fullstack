/**
 * MEMORY STORE compatible avec express-session
 * Pour développement sur Windows sans Redis
 * Implémente l'interface Store d'express-session
 */

/**
 * MEMORY STORE compatible avec express-session
 * Implémente toutes les méthodes requises
 */

const EventEmitter = require('events');

class MemoryStore extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    console.log('📦 MemoryStore initialisé (développement uniquement)');
  }

  // Récupère une session
  get(sid, callback) {
    try {
      const session = this.sessions.get(sid);
      if (!session) {
        return callback(null, null);
      }
      
      // Vérifie l'expiration
      if (session.cookie && session.cookie.expires && session.cookie.expires < Date.now()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }
      
      callback(null, session);
    } catch (error) {
      callback(error);
    }
  }

  // Crée ou met à jour une session
  set(sid, session, callback) {
    try {
      this.sessions.set(sid, session);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  // Détruit une session
  destroy(sid, callback) {
    try {
      this.sessions.delete(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  // Touche une session (met à jour l'expiration)
  touch(sid, session, callback) {
    try {
      const existingSession = this.sessions.get(sid);
      if (existingSession) {
        existingSession.cookie = session.cookie;
        this.sessions.set(sid, existingSession);
      }
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  // Méthode createSession requise par express-session
  createSession(sid, session) {
    this.sessions.set(sid, session);
    return session;
  }

  // Récupère toutes les sessions
  all(callback) {
    try {
      const sessions = [];
      for (const [sid, session] of this.sessions) {
        sessions.push({ sid, session });
      }
      callback(null, sessions);
    } catch (error) {
      callback(error);
    }
  }

  // Récupère la taille du store
  length(callback) {
    try {
      callback(null, this.sessions.size);
    } catch (error) {
      callback(error);
    }
  }

  // Efface toutes les sessions
  clear(callback) {
    try {
      this.sessions.clear();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = true;
    this.MemoryStore = MemoryStore;
  }

  async connect() {
    console.log('⚠️  Mode développement: Utilisation du MemoryStore pour les sessions');
    return this;
  }

  async disconnect() {
    this.isConnected = false;
  }

  getClient() {
    return this;
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;