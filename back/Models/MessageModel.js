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
  // je cherche le message dans MongoDB par son ID
  const message = await Message.findById(messageId);
  // message introuvable → erreur (peut avoir été supprimé entre temps)
  if (!message) throw new Error("Message non trouvé");
  // le userId du JWT est un number, celui en MongoDB est un string → je compare les deux en string
  // si c'est pas l'auteur du message → je bloque ici, le message est pas modifié
  if (String(message.userId) !== String(userId)) throw new Error("Non autorisé");
  // je remplace le contenu
  message.content = newContent;
  // je marque le message comme édité pour afficher "(modifié)" dans l'interface
  message.is_edited = true;
  message.edited_at = new Date();
  // je sauvegarde les changements en MongoDB
  await message.save();
  return message;
};

export const toggleReactionService = async (messageId, userId, emoji) => {
  // je cherche le message dans MongoDB
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message non trouvé");

  // je convertis en string pour être sûr que la comparaison marche bien
  const uid = String(userId);
  // je cherche si cet emoji existe déjà dans les réactions du message
  const existing = message.reactions.find(r => r.emoji === emoji);
  if (existing) {
    // l'emoji existe — est-ce que cet user a déjà voté ?
    const idx = existing.users.indexOf(uid);
    if (idx === -1) {
      // pas encore voté → je l'ajoute (toggle ON)
      existing.users.push(uid);
    } else {
      // déjà voté → je le retire (toggle OFF)
      existing.users.splice(idx, 1);
      // si plus personne n'a réagi avec cet emoji → je supprime l'entrée complète
      if (existing.users.length === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }
  } else {
    // première fois que cet emoji est utilisé sur ce message → je crée l'entrée
    message.reactions.push({ emoji, users: [uid] });
  }

  // je sauvegarde le message avec les réactions mises à jour
  await message.save();
  return message;
};
