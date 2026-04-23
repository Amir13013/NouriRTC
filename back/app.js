import express from 'express';
import cors from 'cors';
import some_error from './middleware/Error.js';
import authRoutes from './Routes/Authentication.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './Config/DataBase.js';
import './Config/MongoConfig.js';
import jwt from 'jsonwebtoken';
import Servers from './Routes/Server.js';
import Channels from './Routes/Channel.js';
import setupSwagger from './Config/swagger.js';
import Message from './Routes/Message.js';
import Gif from './Routes/Gif.js';
import Dm from './Routes/Dm.js';
import Translate from './Routes/Translate.js';
import { createMessageService } from './Models/MessageModel.js';
import { registerMessageEditEvents } from './socketEvents/messageEditEvents.js';
import { registerReactionEvents } from './socketEvents/reactionEvents.js';
import { registerDmEvents } from './socketEvents/dmEvents.js';
import { isUserMutedService } from './Models/MuteModel.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/servers', Servers);
app.use('/channels', Channels);
app.use('/message', Message);
app.use('/gif', Gif);
app.use('/dm', Dm);
app.use('/translate', Translate);

setupSwagger(app);
app.use(some_error);

// PostgreSQL dans Docker met du temps à démarrer au premier lancement
// sans ce retry, le backend crashait direct avec "ENOTFOUND db"
// ici je réessaie jusqu'à 12 fois avec 3 secondes entre chaque tentative
async function connectPostgres(maxAttempts = 12, delayMs = 3000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const client = await pool.connect();
      client.release(); // je libère la connexion de test, c'était juste pour vérifier
      console.log('Connecté à PostgreSQL');
      return;
    } catch (err) {
      if (i === maxAttempts) {
        // après 12 tentatives → impossible de se connecter → on arrête tout
        console.error('PostgreSQL inaccessible après plusieurs tentatives :', err.message);
        process.exit(1);
      }
      console.log(`PostgreSQL non prêt (tentative ${i}/${maxAttempts}), nouvel essai dans ${delayMs / 1000}s…`);
      // j'attends 3 secondes avant de réessayer
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function ensureTables() {
  // crée la table banned_users si elle n'existe pas encore (migration automatique)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_users (
      id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID        NOT NULL,
      server_id  UUID        NOT NULL,
      reason     TEXT,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT banned_users_unique UNIQUE (user_id, server_id),
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )
  `);
}

async function startServer() {
  await connectPostgres();
  await ensureTables();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.set('io', io);

  const updateUsers = async (channelId) => {
    const sockets = await io.in(channelId).fetchSockets();
    const users = sockets.map(s => s.data.displayName).filter(Boolean);
    io.to(channelId).emit('channel users', { channelId, users });
  };

  // userId → nombre de sockets actives (pour gérer plusieurs onglets)
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    let displayName;

    try {
      // le frontend envoie le token JWT lors de la connexion socket
      const token = socket.handshake.auth?.token;
      // pas de token → je refuse la connexion direct
      if (!token) return socket.disconnect();

      // je vérifie et décode le token — même sécurité que les routes HTTP
      socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // je stocke l'ID de l'user dans les données du socket pour y accéder plus tard
      socket.data.userId = socket.user.id;

      // je construis le nom affiché : prénom en priorité, sinon nom, sinon un ID court
      displayName =
        (socket.user?.first_name && String(socket.user.first_name).trim()) ||
        (socket.user?.name && String(socket.user.name).trim()) ||
        `user-${socket.id.slice(0, 5)}`;

      socket.data.displayName = displayName;
      socket.emit('system', `Bienvenue ${displayName} !`);

      // Marquer en ligne — incrémente le compteur pour supporter plusieurs onglets
      const uid = String(socket.user.id);
      onlineUsers.set(uid, (onlineUsers.get(uid) || 0) + 1);
      io.emit('user:status', { userId: uid, online: true });
    } catch {
      // token invalide ou expiré → on coupe la connexion socket
      return socket.disconnect();
    }

    socket.on('join channel', async (channelId) => {
      const room = String(channelId || '').trim();
      if (!room) return;
      socket.data.channelId = room;
      // l'utilisateur entre dans la "room" Socket.IO de ce channel
      await socket.join(room);
      // je notifie les autres membres que quelqu'un a rejoint
      socket.to(room).emit('system', `${displayName} a rejoint le channel`);
      // je mets à jour la liste des utilisateurs connectés dans ce channel
      await updateUsers(room);
    });

    socket.on('leave channel', async (channelId) => {
      const room = String(channelId || '').trim();
      if (!room) return;
      // l'utilisateur quitte la room → il ne recevra plus les messages de ce channel
      await socket.leave(room);
      if (socket.data.channelId === room) socket.data.channelId = null;
      socket.to(room).emit('system', `${displayName} a quitté le channel`);
      await updateUsers(room);
    });

    socket.on('channel message', async ({ channelId, msg }) => {
      try {
        const room    = String(channelId || '').trim();
        const message = String(msg || '').trim();
        if (!room || !message) return;

        const userId = socket.user.id;

        // je vérifie que ce channel appartient bien à un serveur existant
        const channelRes = await pool.query(
          'SELECT server_id FROM channels WHERE id = $1', [room]
        );
        if (channelRes.rows.length === 0) return;
        const serverIdOfChannel = channelRes.rows[0].server_id;

        // je vérifie que l'utilisateur est bien membre du serveur
        // si non → je le déconnecte direct (il a pas le droit d'être là)
        const memberRes = await pool.query(
          'SELECT 1 FROM users_servers WHERE user_id = $1 AND server_id = $2',
          [userId, serverIdOfChannel]
        );
        if (memberRes.rows.length === 0) { socket.disconnect(true); return; }

        // je vérifie si l'utilisateur est mute avant d'envoyer
        // vérification côté serveur → impossible à contourner côté client
        const muteStatus = await isUserMutedService(userId, serverIdOfChannel);
        if (muteStatus.muted) {
          // il est mute → je lui renvoie l'événement avec la date de fin de mute
          socket.emit('system:muted', { expiresAt: muteStatus.expiresAt });
          return;
        }

        // je sauvegarde le message dans MongoDB avant de le diffuser
        const savedMessage = await createMessageService(userId, room, message);

        // j'envoie le message à TOUS les gens dans ce channel (y compris l'expéditeur)
        io.to(room).emit('channel message', {
          _id:       String(savedMessage._id),
          channelId: savedMessage.channelId,
          msg:       savedMessage.content,
          sender:    displayName,   // nom de l'expéditeur pour l'affichage
          senderId:  String(userId), // ID pour savoir si c'est "mon" message côté frontend
          createdAt: savedMessage.createdAt,
        });
      } catch (error) {
        console.error('Erreur message socket:', error);
      }
    });

    socket.on('typing', ({ channelId, isTyping }) => {
      const room = String(channelId || '').trim();
      if (!room) return;
      socket.to(room).emit('typing', { channelId: room, user: displayName, isTyping: !!isTyping });
    });

    socket.on('disconnect', async () => {
      if (socket.user?.id) {
        const uid = String(socket.user.id);
        const cnt = (onlineUsers.get(uid) || 1) - 1;
        if (cnt <= 0) { onlineUsers.delete(uid); io.emit('user:status', { userId: uid, online: false }); }
        else onlineUsers.set(uid, cnt);
      }
      const room = socket.data.channelId;
      if (room) await updateUsers(room);
    });

    // Envoie la liste complète des users en ligne au client qui la demande
    socket.on('users:getOnline', () => {
      socket.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // ── Modular socket event handlers ───────────────────────────────
    registerMessageEditEvents(socket, io);
    registerReactionEvents(socket, io);
    registerDmEvents(socket, io);
  });

  const PORT_BACK = process.env.PORT_BACK || 3001;
  httpServer.listen(PORT_BACK, () => {
    console.log(`Server running on port ${PORT_BACK}`);
  });
}

startServer();
