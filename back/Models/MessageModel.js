import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  channelId: { type: String, required: true, ref: 'Channel' },
  content: { type: String, required: true, trim: true },
  is_edited: { type: Boolean, default: false },
  edited_at: { type: Date, default: null },
  reactions: [{
    emoji: { type: String },
    users: [{ type: String }],
  }],
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
  if (!deleted) throw new Error("Message non trouvé");
  return deleted;
};

export const editMessageService = async (messageId, userId, newContent) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message non trouvé");
  // userId from JWT is a number, MongoDB stores it as string — compare both as strings
  if (String(message.userId) !== String(userId)) throw new Error("Non autorisé");
  message.content = newContent;
  message.is_edited = true;
  message.edited_at = new Date();
  await message.save();
  return message;
};

export const toggleReactionService = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message non trouvé");

  const uid = String(userId);
  const existing = message.reactions.find(r => r.emoji === emoji);
  if (existing) {
    const idx = existing.users.indexOf(uid);
    if (idx === -1) {
      existing.users.push(uid);
    } else {
      existing.users.splice(idx, 1);
      if (existing.users.length === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }
  } else {
    message.reactions.push({ emoji, users: [uid] });
  }

  await message.save();
  return message;
};
