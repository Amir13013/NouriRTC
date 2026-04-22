import { editMessageService } from '../Models/MessageModel.js';

export const registerMessageEditEvents = (socket, io) => {
  // le frontend envoie cet événement quand quelqu'un veut modifier son message
  socket.on('message:edit', async ({ messageId, content }) => {
    try {
      // si le messageId ou le contenu est vide → on fait rien
      if (!messageId || !content?.trim()) return;
      // je passe socket.user.id (l'ID de l'utilisateur connecté) → impossible à falsifier
      // le service vérifie que c'est bien lui l'auteur du message, sinon il lance une erreur
      const updated = await editMessageService(messageId, socket.user.id, content.trim());
      // je diffuse la modification à TOUS les gens dans ce channel en temps réel
      io.to(String(updated.channelId)).emit('message:edited', {
        messageId: String(updated._id),
        content: updated.content,
        editedAt: updated.edited_at,
      });
    } catch (error) {
      // si c'est pas son message → l'erreur "Non autorisé" remonte ici et je la renvoie à lui seul
      socket.emit('error', { message: error.message });
    }
  });
};
