import express from 'express';
import { translateMessage } from '../Controllers/TranslateControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const router = express.Router();

/**
 * POST /translate
 * Body: { text: string, target: 'en' | 'es' }
 * Returns: { translated: string }
 */
router.post('/', authenticate, translateMessage);

export default router;
