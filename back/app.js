import express from 'express';
import cors from 'cors';
import some_error from './middleware/Error.js';
import User from './Routes/User.js';
import authRoutes from './Routes/Auth.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './Config/DataBase.js';
import jwt from 'jsonwebtoken';
import Servers from './Routes/Server.js';
import setupSwagger from './Config/swagger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api', User);
app.use('/api/servers', Servers);

setupSwagger(app);

app.use(some_error);

// Connexion à Postgre + créa serveur socket 
pool.connect()
  .then(() => {
    console.log('Connecté à PostgreSQL');

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: { origin: 'http://localhost:3000' },
    });

    // Maj users dans un channel
    const updateUsers = async (channelId) => {
      const sockets = await io.in(channelId).fetchSockets();
      const users = sockets.map(s => s.data.displayName).filter(Boolean);
      io.to(channelId).emit('channel users', { channelId, users });
    };

    io.on('connection', (socket) => {
      // Auth via JWT
      let displayName;

      try {
        const token = socket.handshake.auth?.token;
        if (!token) return socket.disconnect();

        socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        displayName =
          (socket.user?.first_name && String(socket.user.first_name).trim()) ||
          (socket.user?.name && String(socket.user.name).trim()) ||
          `user-${socket.id.slice(0, 5)}`;

        socket.data.displayName = displayName;

        socket.emit('system', `Bienvenue ${displayName} !`);
      } catch {
        return socket.disconnect();
      }

      // join (channelId = room)
      socket.on('join channel', async (channelId) => {
        const room = String(channelId || '').trim();
        if (!room) return;

        socket.data.channelId = room;

        await socket.join(room);

        socket.emit('system', `Tu as rejoint le channel ${room}`);
        socket.to(room).emit('system', `${displayName} a rejoint le channel`);

        await updateUsers(room);
      });

      // leave le channel
      socket.on('leave channel', async (channelId) => {
        const room = String(channelId || '').trim();
        if (!room) return;

        await socket.leave(room);

        if (socket.data.channelId === room) socket.data.channelId = null;

        socket.emit('system', `Tu as quitté le channel ${room}`);
        socket.to(room).emit('system', `${displayName} a quitté le channel`);

        await updateUsers(room);
      });

      // message
      socket.on('channel message', ({ channelId, msg }) => {
        const room = String(channelId || '').trim();
        const message = String(msg || '').trim();
        if (!room || !message) return;

        io.to(room).emit('channel message', {
          channelId: room,
          msg: message,
          sender: displayName,
        });
      });

      // typing msg
      socket.on('typing', ({ channelId, isTyping }) => {
        const room = String(channelId || '').trim();
        if (!room) return;

        socket.to(room).emit('typing', {
          channelId: room,
          user: displayName,
          isTyping: !!isTyping,
        });
      });

      // disocnnect
      socket.on('disconnect', async () => {
        const room = socket.data.channelId;
        if (room) await updateUsers(room);
      });
    });

    const PORT_BACK = process.env.PORT_BACK || 3001;
    httpServer.listen(PORT_BACK, () => {
      console.log(`Server running on port ${PORT_BACK}`);
    });
  })
  .catch(err => console.error('Erreur de connexion à PostgreSQL :', err));
