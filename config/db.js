const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('📦 Utilisation de la connexion existante');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_demo';
    
    console.log(`🔌 Connexion à MongoDB: ${mongoURI}`);

    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.isConnected = true;
      console.log(`✅ MongoDB connecté: ${conn.connection.host}:${conn.connection.port}`);
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erreur MongoDB:', err.message);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB déconnecté');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error.message);
      console.log('\n💡 Solutions:');
      console.log('   1. Installez MongoDB depuis https://www.mongodb.com/try/download/community');
      console.log('   2. Ou utilisez MongoDB Atlas (cloud gratuit): https://www.mongodb.com/atlas');
      console.log('   3. Vérifiez que MongoDB est démarré: net start MongoDB\n');
      process.exit(1);
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📤 MongoDB déconnecté');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error.message);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

const database = new Database();
module.exports = database;