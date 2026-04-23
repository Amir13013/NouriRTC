import express from 'express';
import { listConversations, createConversation, getMessages, searchUsers } from '../Controllers/DmControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const router = express.Router();

router.get('/conversations',             authenticate, listConversations);
router.post('/conversations',            authenticate, createConversation);
router.get('/conversations/:id/messages', authenticate, getMessages);
router.get('/users/search',              authenticate, searchUsers);

export default router;
