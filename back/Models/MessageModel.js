import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  channelId: { type: String, required: true, ref: 'Channel' },
  content: { type: String, required: true, trim: true },
  is_edited: { type: Boolean, default: false },
  edited_at: { type: Date, default: null },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export const createMessageService = async (userId, channelId, content) => {
  return await Message.create({ userId, channelId, content });
};

export const getMessagesByChannelService = async (channelId) => {
  return await Message.find({ channelId }).sort({ createdAt: 1 });
};

export const deleteMessageService = async (messageId) => {
  const deleted = await Message.findByIdAndDelete(messageId);
  if (!deleted) throw new Error('Message non trouvé');
  return deleted;
};

export const editMessageService = async (messageId, userId, newContent) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('Message non trouvé');
  if (message.userId !== userId) throw new Error('Non autorisé');
  message.content = newContent;
  message.is_edited = true;
  message.edited_at = new Date();
  await message.save();
  return message;
};
