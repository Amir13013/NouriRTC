# Projet RTC

Le but de ce projet était de découvrir et mettre en place une application de **communication en temps réel (RTC)**, en combinant une **API backend**, une **base de données PostgreSQL**, et un **front-end moderne**, tout en respectant une architecture claire et modulaire.

Le projet permet :
- l’authentification des utilisateurs via **JWT**
- la récupération des informations utilisateurs depuis **PostgreSQL**
- la communication en temps réel avec **Socket.IO**
- la gestion de **rooms via socket.io**
- l’affichage du **nom de l’expéditeur** pour chaque message
- une séparation claire entre **front**, **back** et **db**


## Technologies utilisées

- [HTML5](https://www.w3schools.com/html/default.asp)
- [CSS3](https://www.w3schools.com/css/default.asp)
- [Node.js](https://www.w3schools.com/nodejs/)
- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/docs/v4/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [PGAdmin4](https://www.pgadmin.org/docs/)
- [JWT (JSON Web Token)](https://jwt.io/introduction)
- [Docker](https://www.w3schools.in/docker/intro)
- [Next.js](https://nextjs.org/docs)


## Fonctionnalités principales

- Authentification utilisateur (JWT)
- Connexion sécurisée des sockets via token
- Création et gestion de rooms Socket.IO
- Envoi de messages ciblés par room
- Affichage du nom  de l’utilisateur connecté
- Architecture prête pour la création de “serveurs” (style Discord)
- Communication temps réel sans rechargement de page


## Architecture du projet

- **Front-end** : Next.js (port 3000)
- **Back-end** : Express + Socket.IO (port 3001)
- **Base de données** : PostgreSQL
- **Admin DB** : PGAdmin


## Déploiement

À la racine du projet, avec docker desktop ready :

docker compose build

docker compose up


## Acccès aux services

Front-end (application): http://localhost:3000

Back-end (API + Socket.IO): http://localhost:3001

PGAdmin (administration DB): http://localhost:5050

## Auteurs
[Shérine](https://github.com/)
[DOUKHANE_Amir](https://github.com/Amir13013)
[FOUDIL-BEY_Nouri](https://github.com/Nouri3406)
