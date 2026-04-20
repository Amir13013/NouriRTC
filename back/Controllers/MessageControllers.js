import {
  createMessageService,
  getMessagesByChannelService,
  deleteMessageService,
  editMessageService,
} from '../Models/MessageModel.js';

export const createMessage = async (req, res, next) => {
  try {
    const { channelId, content } = req.body;
    const newMessage = await createMessageService(req.user.id, channelId, content);
    res.status(201).json({ message: 'Message créé avec succès', data: newMessage });
  } catch (error) { next(error); }
};

export const getMessagesByChannel = async (req, res, next) => {
  try {
    const messages = await getMessagesByChannelService(req.params.channelId);
    res.status(200).json({ message: 'Messages récupérés avec succès', data: messages });
  } catch (error) { next(error); }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await deleteMessageService(req.params.messageId);
    res.status(200).json({ message: 'Message supprimé avec succès' });
  } catch (error) { next(error); }
};

export const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Contenu vide' });
    const updated = await editMessageService(req.params.messageId, req.user.id, content.trim());
    res.status(200).json({ message: 'Message modifié', data: updated });
  } catch (error) {
    if (error.message === 'Non autorisé') return res.status(403).json({ message: error.message });
    if (error.message === 'Message non trouvé') return res.status(404).json({ message: error.message });
    next(error);
  }
};
