# 🔐 TP9 - Authentification et Autorisation avec Node.js et Express

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18.x-blue?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-brightgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-9.x-orange?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Un système d'authentification complet avec Node.js, Express et MongoDB**


---

## 🎯 Objectifs pédagogiques

À l'issue de ce TP, vous serez capable de :

| Compétence | Niveau |
|------------|--------|
| Comprendre les concepts d'authentification et d'autorisation | ✅ Maîtrise |
| Implémenter le hachage sécurisé des mots de passe avec bcrypt | ✅ Maîtrise |
| Mettre en place l'authentification par sessions avec express-session | ✅ Maîtrise |
| Créer un système d'authentification sans état avec JWT | ✅ Maîtrise |
| Implémenter un système de refresh tokens | ✅ Maîtrise |
| Sécuriser une application contre les attaques courantes | ✅ Maîtrise |

---

## 🛠 Technologies utilisées

### Backend
| Technologie | Version | Utilité |
|-------------|---------|---------|
| Node.js | 18.x | Runtime JavaScript |
| Express.js | 4.18.x | Framework web |
| MongoDB | 7.x | Base de données NoSQL |
| Mongoose | 7.x | ODM MongoDB |
| bcrypt | 5.x | Hachage mots de passe |
| JSON Web Token | 9.x | Tokens d'authentification |
| express-session | 1.17.x | Gestion des sessions |

### Sécurité
| Technologie | Utilité |
|-------------|---------|
| helmet | Sécurisation en-têtes HTTP |
| express-rate-limit | Limitation requêtes |
| express-mongo-sanitize | Protection NoSQL |
| xss-clean | Protection XSS |
| bcrypt | Hachage mots de passe |

---

## 📁 Architecture du projet
```

tp9-auth-express-demo/
│
├── 📂 config/                          # Configuration des services
│   ├── db.js                          # Connexion MongoDB
│   └── redis.js                       # Session store (MemoryStore pour dev)
│
├── 📂 controllers/                     # Logique métier (Contrôleurs)
│   └── authController.js              # Gestion authentification (JWT + Sessions)
│
├── 📂 middlewares/                     # Middlewares Express
│   ├── auth.js                        # Authentification & autorisation
│   ├── errorHandler.js                # Gestion centralisée des erreurs
│   └── validation.js                  # Validation des entrées utilisateur
│
├── 📂 models/                          # Modèles MongoDB (ODM Mongoose)
│   └── User.js                        # Schéma utilisateur avec bcrypt
│
├── 📂 routes/                          # Routes de l'API
│   └── authRoutes.js                  # Endpoints authentification
│
├── 📂 utils/                           # Utilitaires et helpers
│   ├── tokenUtils.js                  # Génération/vérification JWT
│   └── security.js                    # Fonctions sécurité (XSS, validation)
│
├── 📂 public/                          # Interface web frontend (optionnel)
│   └── index.html                     # Interface utilisateur minimaliste
│
├── 📂 node_modules/                    # Dépendances npm (généré)
│
├── 📄 server.js                        # Point d'entrée principal
├── 📄 package.json                     # Dépendances et scripts
├── 📄 package-lock.json                # Version exacte des dépendances
├── 📄 .env                             # Variables d'environnement (ignoré)
├── 📄 .env.example                     # Template variables d'environnement
├── 📄 .gitignore                       # Fichiers ignorés par Git
├── 📄 make-admin.js                    # Script promotion utilisateur admin
├── 📄 README.md                        # Documentation du projet

```


---

## 🚀 Installation

### Prérequis

```bash
# Vérifier les versions
node --version    # v18.x ou supérieur
npm --version     # v9.x ou supérieur
mongod --version  # v7.x ou supérieur

```

## Étapes d'installation

# 1. Cloner le projet
git clone https://github.com/your-repo/tp9-auth-express-demo.git
cd tp9-auth-express-demo

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer MongoDB
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# 5. Démarrer l'application
npm run dev
```
## ✨ Fonctionnalités

### 🔐 Authentification

| Statut | Fonctionnalité | Description |
|:------:|----------------|-------------|
| ✅ | JWT Tokens | Access token (15 min) + Refresh token (7 jours) |
| ✅ | Sessions | Stockage mémoire (développement) |
| ✅ | Hachage bcrypt | Mots de passe sécurisés (12 rounds) |
| ✅ | Refresh tokens | Renouvellement automatique |
| ✅ | Rate limiting | 5 tentatives / 15 minutes |
| ✅ | Compte verrouillage | Après 5 échecs consécutifs |

### 🛡️ Autorisation

| Statut | Fonctionnalité | Description |
|:------:|----------------|-------------|
| ✅ | RBAC | Rôles `user` et `admin` |
| ✅ | Routes protégées | Middleware d'authentification |
| ✅ | Vérification rôles | Accès basé sur les permissions |

### 🔒 Sécurité

| Statut | Fonctionnalité | Description |
|:------:|----------------|-------------|
| ✅ | Helmet | En-têtes HTTP sécurisés |
| ✅ | CORS | Configuration cross-origin |
| ✅ | XSS Protection | Nettoyage des entrées |
| ✅ | NoSQL Injection | Sanitization des requêtes |
| ✅ | HTTP-only Cookies | Refresh tokens sécurisés |

---

## 📡 API Endpoints

### 🔑 Authentification JWT

| Méthode | Endpoint | Description | Auth | Statut |
|:-------:|----------|-------------|:----:|:------:|
| `POST` | `/api/auth/register-jwt` | Inscription | 🔓 | ✅ |
| `POST` | `/api/auth/login-jwt` | Connexion | 🔓 | ✅ |
| `GET` | `/api/auth/profile-jwt` | Profil utilisateur | 🔒 | ✅ |
| `GET` | `/api/auth/refresh-token` | Rafraîchir token | 🍪 | ✅ |
| `GET` | `/api/auth/logout-jwt` | Déconnexion | 🔒 | ✅ |
| `GET` | `/api/auth/admin-only-jwt` | Zone admin | 👑 | ✅ |

### 🍪 Authentification Sessions

| Méthode | Endpoint | Description | Auth | Statut |
|:-------:|----------|-------------|:----:|:------:|
| `POST` | `/api/auth/register-session` | Inscription | 🔓 | ✅ |
| `POST` | `/api/auth/login-session` | Connexion | 🔓 | ✅ |
| `GET` | `/api/auth/profile-session` | Profil utilisateur | 🔒 | ⚠️ |
| `GET` | `/api/auth/logout-session` | Déconnexion | 🔒 | ✅ |
| `GET` | `/api/auth/admin-only` | Zone admin | 👑 | ⚠️ |

### 🛠️ Utilitaires

| Méthode | Endpoint | Description | Statut |
|:-------:|----------|-------------|:------:|
| `GET` | `/health` | État du serveur | ✅ |
| `GET` | `/` | Documentation API | ✅ |

---

## 📈 Légende

| Icône | Signification |
|:-----:|---------------|
| 🔓 | Accès public |
| 🔒 | Authentification requise |
| 🍪 | Cookie requis |
| 👑 | Rôle admin requis |
| ✅ | Fonctionnel |
| ⚠️ | À améliorer |
