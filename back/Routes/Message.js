import express from 'express';
import {
  createMessage,
  getMessagesByChannel,
  deleteMessage
} from '../Controllers/MessageControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const router = express.Router();

router.post('/', authenticate, createMessage);

router.get('/channel/:channelId', authenticate, getMessagesByChannel);

router.delete('/:messageId', authenticate, deleteMessage);

export default router;