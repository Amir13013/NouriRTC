import { toggleReactionService } from '../Models/MessageModel.js';

export const registerReactionEvents = (socket, io) => {
  socket.on('message:react', async ({ messageId, emoji }) => {
    try {
      if (!messageId || !emoji) return;
      const updated = await toggleReactionService(messageId, socket.user.id, emoji);
      io.to(String(updated.channelId)).emit('message:reacted', {
        messageId: String(updated._id),
        reactions: updated.reactions,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
