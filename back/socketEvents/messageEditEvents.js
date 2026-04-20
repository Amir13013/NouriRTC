import { editMessageService } from '../Models/MessageModel.js';

export const registerMessageEditEvents = (socket, io) => {
  socket.on('message:edit', async ({ messageId, content }) => {
    try {
      if (!messageId || !content?.trim()) return;
      const updated = await editMessageService(messageId, socket.user.id, content.trim());
      io.to(String(updated.channelId)).emit('message:edited', {
        messageId: String(updated._id),
        content: updated.content,
        editedAt: updated.edited_at,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
