import { toggleReactionService } from '../Models/MessageModel.js';

export const registerReactionEvents = (socket, io) => {
  // le frontend envoie cet événement quand quelqu'un clique sur un emoji
  socket.on('message:react', async ({ messageId, emoji }) => {
    try {
      // si y'a pas de message ou d'emoji → on fait rien
      if (!messageId || !emoji) return;
      // le service gère le toggle : si déjà réagi → retire, sinon → ajoute
      const updated = await toggleReactionService(messageId, socket.user.id, emoji);
      // j'envoie les nouvelles réactions à tout le channel pour que tout le monde les voie en direct
      io.to(String(updated.channelId)).emit('message:reacted', {
        messageId: String(updated._id),
        reactions: updated.reactions,
      });
    } catch (error) {
      // si le message existe plus (supprimé entre temps) → je préviens juste l'user
      socket.emit('error', { message: error.message });
    }
  });
};
