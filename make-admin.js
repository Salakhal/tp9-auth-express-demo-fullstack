 
// make-admin.js
const mongoose = require('mongoose');
require('dotenv').config();

// Définition du modèle User (version simplifiée)
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  username: String
});

const User = mongoose.model('User', userSchema);

async function makeAdmin() {
  try {
    // Connexion à MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_demo';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Modifier le rôle d'Alice
    const result = await User.updateOne(
      { email: 'alice@example.com' },
      { $set: { role: 'admin' } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Alice est maintenant ADMIN !');
      
      // Vérifier la modification
      const user = await User.findOne({ email: 'alice@example.com' });
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nom: ${user.username}`);
      console.log(`👑 Rôle: ${user.role}`);
    } else if (result.matchedCount === 0) {
      console.log('❌ Utilisateur non trouvé avec l\'email: alice@example.com');
    } else {
      console.log('ℹ️ Alice est déjà administrateur');
    }
    
    // Déconnexion
    await mongoose.disconnect();
    console.log('📤 Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌Erreur:', error.message);
    process.exit(1);
  }
}

// Exécution
makeAdmin();