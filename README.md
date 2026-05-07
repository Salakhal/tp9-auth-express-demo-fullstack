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
# 🔐 TP9 - Authentification et Autorisation avec Node.js et Express

## ✨ Fonctionnalités

### Authentification

| Fonctionnalité | Description |
|----------------|-------------|
| ✅ **JWT Tokens** | Access token (15 min) + Refresh token (7 jours) |
| ✅ **Sessions** | Stockage mémoire (développement) |
| ✅ **Hachage bcrypt** | Mots de passe sécurisés (12 rounds) |
| ✅ **Refresh tokens** | Renouvellement automatique |
| ✅ **Rate limiting** | 5 tentatives / 15 minutes |
| ✅ **Compte verrouillage** | Après 5 échecs consécutifs |

### Autorisation

| Fonctionnalité | Description |
|----------------|-------------|
| ✅ **RBAC** | Rôles `user` et `admin` |
| ✅ **Routes protégées** | Middleware d'authentification |
| ✅ **Vérification rôles** | Accès basé sur les permissions |

### Sécurité

| Fonctionnalité | Description |
|----------------|-------------|
| ✅ **Helmet** | En-têtes HTTP sécurisés |
| ✅ **CORS** | Configuration cross-origin |
| ✅ **XSS Protection** | Nettoyage des entrées |
| ✅ **NoSQL Injection** | Sanitization des requêtes |
| ✅ **HTTP-only Cookies** | Refresh tokens sécurisés |

---

## 📡 API Endpoints

### Authentification JWT

| Méthode | Endpoint | Description | Authentification |
|:-------:|----------|-------------|:----------------:|
| `POST` | `/api/auth/register-jwt` | Inscription | Public |
| `POST` | `/api/auth/login-jwt` | Connexion | Public |
| `GET` | `/api/auth/profile-jwt` | Profil utilisateur | Bearer |
| `GET` | `/api/auth/refresh-token` | Rafraîchir token | Cookie |
| `GET` | `/api/auth/logout-jwt` | Déconnexion | Bearer |
| `GET` | `/api/auth/admin-only-jwt` | Zone admin | Bearer + Admin |

### Authentification Sessions

| Méthode | Endpoint | Description | Authentification |
|:-------:|----------|-------------|:----------------:|
| `POST` | `/api/auth/register-session` | Inscription | Public |
| `POST` | `/api/auth/login-session` | Connexion | Public |
| `GET` | `/api/auth/profile-session` | Profil utilisateur | Session |
| `GET` | `/api/auth/logout-session` | Déconnexion | Session |
| `GET` | `/api/auth/admin-only` | Zone admin | Session + Admin |

### Utilitaires

| Méthode | Endpoint | Description |
|:-------:|----------|-------------|
| `GET` | `/health` | État du serveur |
| `GET` | `/` | Documentation API |

---

## Installation

```bash
# Cloner le projet
git clone https://github.com/your-repo/tp9-auth-express-demo.git

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer le serveur
npm run dev
```

##  Tests
```
# Inscription
curl -X POST http://localhost:3000/api/auth/register-jwt \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login-jwt \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```
## 📁 Structure du projet
```
tp9-auth-express-demo/
├── config/           # Configuration
├── controllers/      # Logique métier
├── middlewares/      # Middlewares Express
├── models/           # Modèles MongoDB
├── routes/           # Routes API
├── utils/            # Utilitaires
├── public/           # Interface web
├── .env.example      # Template variables
├── make-admin.js     # Script promotion admin
├── package.json      # Dépendances
└── server.js         # Point d'entrée
```


