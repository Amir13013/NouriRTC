import express from 'express';
import { searchGifs, trendingGifs } from '../Controllers/GifControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const router = express.Router();

router.get('/search',   authenticate, searchGifs);
router.get('/trending', authenticate, trendingGifs);

export default router;
