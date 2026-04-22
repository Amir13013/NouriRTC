import { sendDmMessageService } from '../Models/DmModel.js';

export const registerDmEvents = (socket, io) => {
  // le frontend rejoint la "room" DM de cette conversation
  // une room Socket.IO c'est juste un groupe — seuls ceux dedans reçoivent les messages
  socket.on('dm:join', (conversationId) => {
    socket.join(`dm:${conversationId}`);
    // je préfixe avec "dm:" pour pas mélanger avec les rooms des channels
  });

  socket.on('dm:leave', (conversationId) => {
    // l'utilisateur quitte la room — il ne recevra plus les messages de ce DM
    socket.leave(`dm:${conversationId}`);
  });

  socket.on('dm:send', async ({ conversationId, content }) => {
    try {
      // sécurité basique : contenu vide → on fait rien
      if (!conversationId || !content?.trim()) return;
      // je sauvegarde le message en MongoDB avant de le diffuser
      const msg = await sendDmMessageService(conversationId, socket.user.id, content.trim());
      // j'envoie le message aux deux participants du DM (les deux sont dans la room)
      io.to(`dm:${conversationId}`).emit('dm:message', {
        _id: String(msg._id),
        conversationId,
        // l'ID de l'expéditeur vient du socket (JWT vérifié à la connexion) — pas falsifiable
        senderId: socket.user.id,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
