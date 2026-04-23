# Let Us Link

Application de messagerie temps réel inspirée de Discord — serveurs, channels, messages privés, modération, GIFs, traduction automatique et application desktop.

---

## Technologies utilisées

### Backend
- [Node.js](https://nodejs.org/) — runtime JavaScript non-bloquant, idéal pour les connexions simultanées
- [Express.js](https://expressjs.com/) — framework HTTP pour l'API REST
- [Socket.IO](https://socket.io/docs/v4/) — WebSockets temps réel (messages, statuts, réactions)
- [PostgreSQL](https://www.postgresql.org/docs/) — base de données relationnelle (utilisateurs, serveurs, channels, modération)
- [MongoDB](https://www.mongodb.com/docs/) + [Mongoose](https://mongoosejs.com/) — base NoSQL pour les messages
- [JWT](https://jwt.io/introduction) — authentification stateless
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) — hachage des mots de passe (12 rounds)
- [Swagger](https://swagger.io/) — documentation interactive de l'API (`/api-docs`)

### Frontend
- [Next.js 16](https://nextjs.org/docs) — framework React avec App Router
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) — connexion temps réel côté client
- [Web Notifications API](https://developer.mozilla.org/fr/docs/Web/API/Notifications_API) — notifications bureau OS

### Desktop
- [Electron.js](https://www.electronjs.org/) — application desktop Windows/Mac/Linux

### Infrastructure
- [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) — containerisation complète
- [GitHub Actions](https://docs.github.com/fr/actions) — CI/CD automatisé

### APIs externes
- [Giphy API](https://developers.giphy.com/) — GIFs (trending + recherche)
- API de traduction (LibreTranslate/Argos) — traduction automatique des messages

### Tests
- [Jest](https://jestjs.io/) — framework de tests unitaires
- [Supertest](https://github.com/ladjs/supertest) — tests des endpoints HTTP

---

## Fonctionnalités

### Authentification
- Inscription et connexion avec email + mot de passe
- Mots de passe hachés avec bcrypt (12 rounds)
- Authentification via JWT — token envoyé dans chaque requête et vérifié côté serveur
- Connexion Socket.IO sécurisée par token JWT

### Serveurs
- Création de serveurs avec nom personnalisé
- Code d'invitation unique par serveur (recherche insensible à la casse)
- Rejoindre un serveur via code d'invitation
- Système de rôles : **Owner**, **Admin**, **Member**

### Channels & Chat
- Création de channels textuels dans un serveur
- Messagerie temps réel via Socket.IO (rooms par channel)
- Indicateur de frappe ("X est en train d'écrire…")
- Horodatage HH:MM sur chaque message
- Édition de messages (double-clic ou bouton) — mention *(modifié)* affichée
- Réactions emoji sur les messages
- Copie de message au survol (icône 📋)
- Bouton scroll-to-bottom quand on consulte l'historique
- Markdown léger : `**gras**`, `*italique*`, `` `code` ``
- Shift+Enter pour nouvelle ligne, Enter pour envoyer

### GIFs
- Picker de GIFs intégré (bouton 🎬 dans la barre d'envoi)
- GIFs tendance au chargement via API Giphy
- Recherche de GIFs en temps réel
- Clic sur un GIF → affichage plein écran (overlay)

### Messages privés (DMs)
- Recherche d'utilisateurs
- Création de conversation privée
- Messagerie temps réel entre deux utilisateurs
- Markdown et copie disponibles dans les DMs

### Modération (Owner uniquement)
- **Kick** — expulsion immédiate du serveur
- **Ban temporaire** — durées : 5 min, 10 min, 1h, 24h
- **Ban permanent** — avec raison optionnelle
- **Mute** — empêche l'envoi de messages pendant une durée définie (vérifié côté serveur)

### Statuts & Notifications
- Point vert/gris en temps réel sur les avatars (en ligne / hors ligne)
- Gestion multi-onglets (le statut reste en ligne si un seul onglet est fermé)
- Notifications bureau OS quand un message arrive sur un onglet en arrière-plan

### Multilingue
- Interface disponible en **français**, **anglais** et **espagnol**
- Traduction automatique des messages via API externe
- Cache de traductions pour éviter les requêtes répétées
- Possibilité de voir le message original au survol

---

## Architecture du projet

```
├── back/                        # Backend Node.js + Express + Socket.IO
│   ├── app.js                   # Point d'entrée, socket, HTTP server
│   ├── Controllers/             # Logique métier (auth, serveurs, messages...)
│   ├── Models/                  # Accès aux données (PostgreSQL + MongoDB)
│   ├── Routes/                  # Définition des routes API REST
│   ├── socketEvents/            # Événements Socket.IO modulaires
│   ├── middleware/              # Authentification JWT, vérification des rôles
│   ├── utils/                   # Utilitaires (traduction...)
│   ├── Config/                  # Connexions BDD, Swagger
│   └── __tests__/               # Tests unitaires Jest
│
├── front/                       # Frontend Next.js
│   ├── app/                     # Pages (App Router)
│   │   ├── chat/[channelId]/    # Page de chat channel
│   │   ├── dm/[conversationId]/ # Page de DM
│   │   ├── server/              # Liste des serveurs
│   │   ├── connexion/           # Page de connexion
│   │   └── inscription/         # Page d'inscription
│   ├── electron/                # Application desktop Electron
│   └── public/                  # Assets statiques (logo...)
│
├── DataBase/                    # Scripts SQL d'initialisation
├── .github/workflows/           # Pipelines CI/CD GitHub Actions
└── docker-compose.yml           # Orchestration Docker
```

---

## Lancer le projet

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé

### Démarrage

```bash
docker compose up
```

Une seule commande démarre l'intégralité de l'environnement : PostgreSQL, MongoDB, backend et frontend.

### Accès aux services

| Service | URL |
|---|---|
| Application web | http://localhost:3000 |
| API backend | http://localhost:3001 |
| Documentation API (Swagger) | http://localhost:3001/api-docs |
| PGAdmin | http://localhost:5050 |
| Mongo Express | http://localhost:8081 |

---

## Application Desktop (Electron)

### Mode développement
```bash
cd front
npm run electron:dev
```

### Générer l'installeur `.exe`
```bash
cd front
npm run electron:build
```
L'installeur est généré dans `front/dist/`.

---

## Tests

### Lancer les tests
```bash
cd back
npm test
```

Lance les **89 tests unitaires** Jest avec génération automatique du rapport de coverage.

### Résultats
- **88/89 tests passent**
- Coverage global : **87%** (seuil minimum configuré : 80%)

| Dossier | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Controllers | 84.53% | 87.62% | 90.32% | 84.31% |
| middleware | 100% | 95.65% | 100% | 100% |
| utils | 100% | 92.85% | 100% | 100% |

### Rapport de coverage HTML
Ouvrir après `npm test` :
```
back/coverage/lcov-report/index.html
```

---

## CI/CD

### Intégration Continue (CI)
Déclenché à chaque **push ou Pull Request sur `main`** :
1. Installation des dépendances backend et frontend
2. Lancement automatique des tests Jest + génération coverage
3. Upload du rapport de coverage comme artifact GitHub
4. Lint du frontend
5. Validation de la configuration Docker Compose

### Déploiement Continu (CD)
Déclenché à chaque **tag `v*.*.*`** :
- Création automatique d'une release GitHub avec changelog généré depuis les commits

### Historique des versions
| Version | Description |
|---|---|
| v1.0.0 | Version initiale — chat, serveurs, channels, auth |
| v1.1.1 | Statuts en ligne, timestamps, GIFs Giphy, notifications, fix invite |
| v1.2.0 | Scroll-to-bottom, copie de message |
| v1.3.0 | Markdown, fullscreen GIF, Shift+Enter |
| v1.4.0 | Rebranding Let Us Link, nouveau logo |
| v1.5.0 | Tests automatiques dans le CI + rapport coverage |
| v2.0.0 | Version finale |

---

## Auteurs

- [Shérine](https://github.com/)
- [DOUKHANE Amir](https://github.com/Amir13013)
- [FOUDIL-BEY Nouri](https://github.com/Nouri3406)
