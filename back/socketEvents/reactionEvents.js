import { toggleReactionService } from '../Models/MessageModel.js';

export const registerReactionEvents = (socket, io) => {
  // le frontend envoie cet événement quand quelqu'un clique sur un emoji
  socket.on('message:react', async ({ messageId, emoji }) => {
    try {
      if (!messageId || !emoji) return;
      const updated = await toggleReactionService(messageId, socket.user.id, emoji);
      // j'envoie les nouvelles réactions à tout le channel pour que tout le monde les voie en direct
      io.to(String(updated.channelId)).emit('message:reacted', {
        messageId: String(updated._id),
        reactions: updated.reactions,
      });
    } catch (error) {
      // si le message existe plus → je préviens juste l'user
      socket.emit('error', { message: error.message });
    }
  });
};
