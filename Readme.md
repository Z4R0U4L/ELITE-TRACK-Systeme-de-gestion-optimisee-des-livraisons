# ⚡ ELITE TRACK
### Système de gestion optimisée des livraisons avec partage de localisation en temps réel

![ELITE TRACK](https://img.shields.io/badge/ELITE%20TRACK-v1.0.0-CC0000?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io)

---

## 📌 À propos du projet

**ELITE TRACK** est une application web de gestion des livraisons permettant à un commerçant de :
- 📦 Créer et gérer ses commandes
- 🗺️ Suivre ses livreurs en temps réel sur une carte GPS
- 📧 Notifier automatiquement les clients avec un lien de suivi
- 📊 Visualiser les statistiques de livraison

> Projet académique — **Management de Projets SI** — M. Elhaloui  
> Méthode : **Scrum** | Outil : **Jira** | Équipe : 5 membres

---

## 🎯 Fonctionnalités

| Fonctionnalité | Commerçant | Livreur | Client |
|---|:---:|:---:|:---:|
| Dashboard avec statistiques | ✅ | ❌ | ❌ |
| Carte GPS temps réel | ✅ | ❌ | ✅ |
| Créer / assigner des commandes | ✅ | ❌ | ❌ |
| Gérer l'équipe de livreurs | ✅ | ❌ | ❌ |
| Activer / désactiver le GPS | ❌ | ✅ | ❌ |
| Voir ses missions assignées | ❌ | ✅ | ❌ |
| Confirmer une livraison | ❌ | ✅ | ❌ |
| Suivi via lien (sans compte) | ❌ | ❌ | ✅ |
| Notification email automatique | ✅ | ❌ | ✅ |

---

## 🏗️ Architecture technique

```
elitetrack/
├── elitetrack-backend/          # API Node.js + Socket.io
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Connexion PostgreSQL
│   │   │   └── migrate.js       # Création des tables
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register / Login / JWT
│   │   │   ├── orderController.js   # CRUD commandes + email
│   │   │   └── userController.js    # Livreurs + notifications
│   │   ├── middleware/
│   │   │   └── auth.js          # Middleware JWT
│   │   ├── routes/
│   │   │   └── index.js         # Toutes les routes API
│   │   └── server.js            # Express + Socket.io
│   └── package.json
│
└── elitetrack-frontend/         # React.js
    ├── public/
    │   └── logo.png
    └── src/
        ├── pages/
        │   ├── Landing.js           # Page d'accueil
        │   ├── Login.js             # Connexion
        │   ├── Register.js          # Inscription
        │   ├── MerchantDashboard.js # Dashboard commerçant
        │   ├── DriverApp.js         # Interface livreur
        │   └── TrackingPage.js      # Suivi client (public)
        ├── context/
        │   └── AuthContext.js       # Auth + JWT global
        └── services/
            ├── api.js               # Axios + intercepteurs
            └── socket.js            # Socket.io client
```

---

## ⚙️ Installation locale

### Prérequis
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- Une base de données PostgreSQL (gratuite sur [Railway](https://railway.app))

---

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/Z4R0U4L/ELITE-TRACK-Systeme-de-gestion-optimisee-des-livraisons.git
cd elite-track
```

---

### 2️⃣ Configurer le Backend

```bash
cd elitetrack-backend
npm install
```

Créer le fichier `.env` :
```bash
cp .env.example .env
```

Remplir le `.env` :
```env
PORT=5000
NODE_ENV=development

# Depuis Railway.app (gratuit)
DATABASE_URL=postgresql://user:password@host:5432/elitetrack

# Clé secrète JWT (n'importe quelle chaîne longue)
JWT_SECRET=elitetrack2026supersecretkey

# Resend.com pour les emails (gratuit)
RESEND_API_KEY=re_votre_cle_api
EMAIL_FROM=onboarding@resend.dev

# URL du frontend
FRONTEND_URL=http://localhost:3000
```

Créer les tables en base de données :
```bash
npm run db:migrate
```

Démarrer le backend :
```bash
npm run dev
```

✅ Le backend tourne sur `http://localhost:5000`

---

### 3️⃣ Configurer le Frontend

```bash
cd ../elitetrack-frontend
npm install
```

Créer le fichier `.env` :
```bash
cp .env.example .env
```

Remplir le `.env` :
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Démarrer le frontend :
```bash
npm start
```

✅ L'application tourne sur `http://localhost:3000`

---

## 🚀 Démonstration

### Étape 1 — Créer un compte commerçant
1. Aller sur `http://localhost:3000`
2. Cliquer **"Commencer gratuitement"**
3. Choisir le rôle **Commerçant**
4. Remplir le formulaire et valider

### Étape 2 — Ajouter un livreur
1. Dans le dashboard → onglet **Livreurs**
2. Cliquer **"+ Ajouter livreur"**
3. Remplir les infos (email + mot de passe)
4. Le livreur peut maintenant se connecter sur `http://localhost:3000`

### Étape 3 — Créer une commande
1. Dans le dashboard → cliquer **"+ Nouvelle commande"**
2. Remplir : nom client, téléphone, **email client**, adresse
3. Valider → la commande apparaît en statut **"En attente"**

### Étape 4 — Assigner un livreur
1. Cliquer **"Assigner"** sur la commande
2. Choisir un livreur disponible
3. ✅ Le client reçoit automatiquement un email avec le lien de suivi

### Étape 5 — Suivi GPS en temps réel
1. Le livreur se connecte → active le **GPS toggle**
2. Le commerçant voit le livreur bouger sur la carte (onglet **Carte GPS**)
3. Le client ouvre son lien de suivi → voit la position du livreur en direct

### Étape 6 — Confirmer la livraison
1. Le livreur clique **"Confirmer livraison"**
2. Le statut passe à **"Livré"** partout en temps réel
3. Le client voit 🎉 "Votre commande a été livrée !"

---

## 🔌 API Endpoints

### Authentification
```
POST   /api/auth/register     Créer un compte
POST   /api/auth/login        Se connecter
GET    /api/auth/me           Profil utilisateur
```

### Commandes
```
GET    /api/orders            Liste des commandes (commerçant)
GET    /api/orders/stats      Statistiques dashboard
POST   /api/orders            Créer une commande
PATCH  /api/orders/:id/assign Assigner un livreur
PATCH  /api/orders/:id/status Mettre à jour le statut
GET    /api/orders/driver     Commandes du livreur connecté
GET    /api/orders/track/:token Suivi public (sans auth)
```

### Utilisateurs
```
GET    /api/users/drivers           Liste des livreurs
POST   /api/users/drivers           Créer un livreur
PATCH  /api/users/drivers/:id/toggle Activer/désactiver
GET    /api/users/notifications     Notifications
```

---

## ⚡ Socket.io — Événements temps réel

### Client → Serveur
| Événement | Données | Description |
|---|---|---|
| `driver:location` | `{latitude, longitude}` | Livreur envoie sa position GPS |
| `driver:sharing` | `{is_sharing}` | Toggle partage GPS |
| `track:join` | `{token}` | Client rejoint la salle de suivi |
| `order:delivered` | `{order_id}` | Livreur confirme la livraison |

### Serveur → Client
| Événement | Données | Description |
|---|---|---|
| `driver:location:update` | `{driver_id, latitude, longitude}` | Mise à jour position GPS |
| `driver:sharing:update` | `{driver_id, is_sharing}` | Changement état GPS |
| `order:status:update` | `{order_id, status}` | Changement statut commande |
| `order:delivered` | `{order_id}` | Livraison confirmée |

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React.js 18, React Router v6 |
| Carte GPS | Leaflet.js + OpenStreetMap |
| Backend | Node.js + Express.js |
| Temps réel | Socket.io |
| Base de données | PostgreSQL |
| Authentification | JWT (JSON Web Tokens) |
| Emails | Resend.com API |
| Hébergement BDD | Railway |
| Déploiement Frontend | Vercel |
| Gestion projet | Jira (Scrum) |

---

## 👥 Équipe

Projet réalisé dans le cadre du cours **Management de Projets SI**

| Membre | Rôle |
|---|---|
| Membre 1 | Scrum Master / Dev |
| Membre 2 | Dev Frontend |
| Membre 3 | Dev Backend |
| Membre 4 | Dev GPS / Socket.io |
| Membre 5 | Tests / Documentation |

---

## 📄 Licence

Projet académique — Usage éducatif uniquement.
