import { translateText } from '../utils/translate.js';

const SUPPORTED = ['en', 'es'];

export const translateMessage = async (req, res, next) => {
  try {
    const { text, target } = req.body;

    if (!text || !target) {
      return res.status(400).json({ message: 'text and target are required' });
    }
    if (!SUPPORTED.includes(target)) {
      return res.status(400).json({ message: `target must be one of: ${SUPPORTED.join(', ')}` });
    }

    const translated = await translateText(String(text), target);
    res.status(200).json({ translated });
  } catch (error) {
    next(error);
  }
};
