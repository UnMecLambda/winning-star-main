# Winning Star Gaming Platform

Une plateforme de jeux compétitifs avec économie virtuelle et récompenses réelles.

## Architecture

- **Frontend**: Angular 17 (Port 4200)
- **Backend**: Node.js + Express + Socket.IO (Port 3001)  
- **Games**: Vite + Phaser (Port 3000)
- **Database**: MongoDB
- **Cache**: Redis (optionnel)

## Installation et Lancement

### Prérequis
- Node.js 18+
- MongoDB
- Redis (optionnel)

### 1. Installation des dépendances

```bash
# Racine du projet
npm install

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Games
cd ../games/pong
npm install
```

### 2. Configuration

```bash
# Copier le fichier d'environnement
cd backend
cp .env.example .env
# Éditer .env avec vos configurations
```

### 3. Lancement des services

**IMPORTANT**: Lancez chaque service dans un terminal séparé :

#### Terminal 1 - Backend API
```bash
cd backend
npm run dev
```
Le backend sera disponible sur http://localhost:3001

#### Terminal 2 - Frontend Angular
```bash
cd frontend  
npm run dev
```
Le frontend sera disponible sur http://localhost:4200

#### Terminal 3 - Jeu Pong
```bash
cd games/pong
npm run dev
```
Le jeu sera disponible sur http://localhost:3000

### 4. Base de données

Assurez-vous que MongoDB est démarré :
```bash
# Sur macOS avec Homebrew
brew services start mongodb-community

# Sur Ubuntu/Debian
sudo systemctl start mongod

# Ou avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Utilisation

1. Ouvrez http://localhost:4200
2. Créez un compte ou connectez-vous
3. Allez dans "Play" pour jouer au Pong
4. Gagnez des parties pour monter dans le classement

## Fonctionnalités

### ✅ Implémentées
- Authentification complète (JWT)
- Jeu Pong multijoueur en temps réel
- Système de matchmaking
- Classements (leaderboard)
- Interface utilisateur moderne
- Architecture modulaire

### 🚧 En développement
- Boutique d'objets
- Système d'inventaire
- Transactions et retraits
- Plus de jeux (course automobile)
- Système de location d'équipement

## Structure du projet

```
winning-star/
├── backend/          # API Node.js + Socket.IO
├── frontend/         # Application Angular
├── games/
│   └── pong/        # Jeu Pong (Phaser)
└── package.json     # Scripts globaux
```

## Scripts disponibles

```bash
# Lancer tous les services (nécessite 3 terminaux)
npm run dev

# Lancer individuellement
npm run dev:backend
npm run dev:frontend  
npm run dev:games

# Build pour production
npm run build
```

## Développement

### Backend (Port 3001)
- Express.js avec TypeScript
- Socket.IO pour le temps réel
- MongoDB avec Mongoose
- JWT pour l'authentification
- Architecture modulaire avec routes séparées

### Frontend (Port 4200)
- Angular 17 avec TypeScript
- Lazy loading des modules
- Intercepteurs HTTP pour l'auth
- Design responsive avec SCSS
- Icônes Lucide Angular

### Games (Port 3000)
- Phaser 3 pour le moteur de jeu
- Socket.IO client pour le multijoueur
- TypeScript pour la logique de jeu
- Vite pour le build rapide

## Troubleshooting

### Erreurs communes

1. **Port déjà utilisé**
   ```bash
   # Tuer le processus sur le port
   lsof -ti:3001 | xargs kill -9
   ```

2. **MongoDB non connecté**
   ```bash
   # Vérifier le statut
   brew services list | grep mongodb
   ```

3. **Erreurs de compilation Angular**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request