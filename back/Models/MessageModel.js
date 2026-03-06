import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  channelId: {
    type: String,
    required: true,
    ref: 'Channel',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

export const createMessageService = async (userId, channelId, content) => {
  const newMessage = await Message.create({
    userId,
    channelId,
    content
  });

  return newMessage;
};

export const getMessagesByChannelService = async (channelId) => {
  const messages = await Message
    .find({ channelId })
    .sort({ createdAt: 1 });

  return messages;
};

export const deleteMessageService = async (messageId) => {
  const deletedMessage = await Message.findByIdAndDelete(messageId);

  if (!deletedMessage) {
    throw new Error("Message non trouvé");
  }

  return deletedMessage;
};