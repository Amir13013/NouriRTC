import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // user IDs (PostgreSQL UUIDs)
}, { timestamps: true });

const dmMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId:       { type: String, required: true },
  content:        { type: String, required: true },
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export const DmMessage    = mongoose.model('DmMessage', dmMessageSchema);

// Crée ou récupère la conversation entre deux users
export const getOrCreateConversation = async (userId1, userId2) => {
  const sorted = [String(userId1), String(userId2)].sort();
  let conv = await Conversation.findOne({ participants: { $all: sorted, $size: 2 } });
  if (!conv) conv = await Conversation.create({ participants: sorted });
  return conv;
};

// Enregistre un message DM
export const sendDmMessageService = async (conversationId, senderId, content) => {
  return DmMessage.create({ conversationId, senderId, content });
};

// Récupère les messages d'une conversation
export const getDmMessagesService = async (conversationId) => {
  return DmMessage.find({ conversationId }).sort({ createdAt: 1 });
};
