import { getOrCreateConversation, getDmMessagesService, Conversation } from '../Models/DmModel.js';
import pool from '../Config/DataBase.js';

// GET /dm/conversations — liste les conversations de l'user connecté
export const listConversations = async (req, res, next) => {
  try {
    const userId = String(req.user.id);
    const convs  = await Conversation.find({ participants: userId }).sort({ updatedAt: -1 });

    // pour chaque conv, je récupère les infos de l'autre participant depuis PostgreSQL
    const result = await Promise.all(convs.map(async (c) => {
      const otherId = c.participants.find(p => p !== userId);
      let otherUser = null;
      if (otherId) {
        const r = await pool.query('SELECT id, name, first_name FROM users WHERE id = $1', [otherId]);
        otherUser = r.rows[0] || null;
      }
      return { _id: c._id, participants: c.participants, otherUser, updatedAt: c.updatedAt };
    }));

    res.json({ data: result });
  } catch (err) { next(err); }
};

// POST /dm/conversations — crée ou récupère une conversation avec targetUserId
export const createConversation = async (req, res, next) => {
  try {
    const userId   = String(req.user.id);
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId requis' });

    const conv = await getOrCreateConversation(userId, targetUserId);

    const otherId = conv.participants.find(p => p !== userId);
    let otherUser = null;
    if (otherId) {
      const r = await pool.query('SELECT id, name, first_name FROM users WHERE id = $1', [otherId]);
      otherUser = r.rows[0] || null;
    }

    res.json({ data: { _id: conv._id, participants: conv.participants, otherUser } });
  } catch (err) { next(err); }
};

// GET /dm/conversations/:id/messages — messages d'une conversation
export const getMessages = async (req, res, next) => {
  try {
    const messages = await getDmMessagesService(req.params.id);
    res.json({ data: messages });
  } catch (err) { next(err); }
};

// GET /dm/users/search?q= — recherche d'utilisateurs
export const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ data: [] });

    const r = await pool.query(
      `SELECT id, name, first_name FROM users
       WHERE (LOWER(name) LIKE $1 OR LOWER(first_name) LIKE $1)
         AND id != $2
       LIMIT 10`,
      [`%${q.toLowerCase()}%`, req.user.id]
    );
    res.json({ data: r.rows });
  } catch (err) { next(err); }
};
