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

setupSwagger(app);
app.use(some_error);

// ── Retry PostgreSQL connection up to 12 times (3s apart) ──────────
async function connectPostgres(maxAttempts = 12, delayMs = 3000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Connecté à PostgreSQL');
      return;
    } catch (err) {
      if (i === maxAttempts) {
        console.error('PostgreSQL inaccessible après plusieurs tentatives :', err.message);
        process.exit(1);
      }
      console.log(`PostgreSQL non prêt (tentative ${i}/${maxAttempts}), nouvel essai dans ${delayMs / 1000}s…`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function startServer() {
  await connectPostgres();

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

  io.on('connection', (socket) => {
    let displayName;

    try {
      const token = socket.handshake.auth?.token;
      if (!token) return socket.disconnect();

      socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.data.userId = socket.user.id;

      displayName =
        (socket.user?.first_name && String(socket.user.first_name).trim()) ||
        (socket.user?.name && String(socket.user.name).trim()) ||
        `user-${socket.id.slice(0, 5)}`;

      socket.data.displayName = displayName;
      socket.emit('system', `Bienvenue ${displayName} !`);
    } catch {
      return socket.disconnect();
    }

    // ── Channel events ──────────────────────────────────────────────
    socket.on('join channel', async (channelId) => {
      const room = String(channelId || '').trim();
      if (!room) return;
      socket.data.channelId = room;
      await socket.join(room);
      socket.to(room).emit('system', `${displayName} a rejoint le channel`);
      await updateUsers(room);
    });

    socket.on('leave channel', async (channelId) => {
      const room = String(channelId || '').trim();
      if (!room) return;
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

        // membership check
        const channelRes = await pool.query(
          'SELECT server_id FROM channels WHERE id = $1', [room]
        );
        if (channelRes.rows.length === 0) return;
        const serverIdOfChannel = channelRes.rows[0].server_id;

        const memberRes = await pool.query(
          'SELECT 1 FROM users_servers WHERE user_id = $1 AND server_id = $2',
          [userId, serverIdOfChannel]
        );
        if (memberRes.rows.length === 0) { socket.disconnect(true); return; }

        // mute check
        const muteStatus = await isUserMutedService(userId, serverIdOfChannel);
        if (muteStatus.muted) {
          socket.emit('system:muted', { expiresAt: muteStatus.expiresAt });
          return;
        }

        const savedMessage = await createMessageService(userId, room, message);

        io.to(room).emit('channel message', {
          _id:       String(savedMessage._id),
          channelId: savedMessage.channelId,
          msg:       savedMessage.content,
          sender:    displayName,
          senderId:  String(userId),
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
      const room = socket.data.channelId;
      if (room) await updateUsers(room);
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
