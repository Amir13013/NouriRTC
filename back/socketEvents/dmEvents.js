import { sendDmMessageService } from '../Models/DmModel.js';

export const registerDmEvents = (socket, io) => {
  socket.on('dm:join', (conversationId) => {
    socket.join(`dm:${conversationId}`);
  });

  socket.on('dm:leave', (conversationId) => {
    socket.leave(`dm:${conversationId}`);
  });

  socket.on('dm:send', async ({ conversationId, content }) => {
    try {
      if (!conversationId || !content?.trim()) return;
      const msg = await sendDmMessageService(conversationId, socket.user.id, content.trim());
      io.to(`dm:${conversationId}`).emit('dm:message', {
        _id: String(msg._id),
        conversationId,
        senderId: socket.user.id,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
