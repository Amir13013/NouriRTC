import {
  createMessageService,
  getMessagesByChannelService,
  deleteMessageService,
  editMessageService,
  toggleReactionService,
} from '../Models/MessageModel.js';

// ces controllers sont les routes HTTP — distinct des événements Socket.IO
// les messages en temps réel passent par socket, mais ces routes existent aussi pour le REST API

export const createMessage = async (req, res, next) => {
  try {
    const { channelId, content } = req.body;
    // req.user.id vient du token JWT décodé par le middleware authenticate
    const newMessage = await createMessageService(req.user.id, channelId, content);
    res.status(201).json({ message: "Message créé avec succès", data: newMessage });
  } catch (error) { next(error); }
};

export const getMessagesByChannel = async (req, res, next) => {
  try {
    // je récupère tous les messages d'un channel depuis MongoDB, triés par date
    const messages = await getMessagesByChannelService(req.params.channelId);
    res.status(200).json({ message: "Messages récupérés avec succès", data: messages });
  } catch (error) { next(error); }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await deleteMessageService(req.params.messageId);
    res.status(200).json({ message: "Message supprimé avec succès" });
  } catch (error) { next(error); }
};

export const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    // .trim() → je vire les espaces inutiles avant de vérifier si c'est vide
    if (!content?.trim()) return res.status(400).json({ message: "Contenu vide" });
    // le service vérifie que c'est bien l'auteur qui édite — si non → erreur "Non autorisé"
    const updated = await editMessageService(req.params.messageId, req.user.id, content.trim());
    res.status(200).json({ message: "Message modifié", data: updated });
  } catch (error) {
    // j'intercepte les erreurs métier connues pour renvoyer le bon code HTTP
    if (error.message === "Non autorisé") return res.status(403).json({ message: error.message });
    if (error.message === "Message non trouvé") return res.status(404).json({ message: error.message });
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji requis" });
    // toggleReactionService gère le toggle : ajoute si pas encore réagi, retire sinon
    const updated = await toggleReactionService(req.params.messageId, req.user.id, emoji);
    // je renvoie juste le tableau de réactions mis à jour (pas tout le message)
    res.status(200).json({ message: "Réaction mise à jour", data: updated.reactions });
  } catch (error) {
    if (error.message === "Message non trouvé") return res.status(404).json({ message: error.message });
    next(error);
  }
};
