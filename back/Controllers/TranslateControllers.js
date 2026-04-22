import { translateText } from '../utils/translate.js';

// les seules langues cibles supportées (le texte source est toujours en français)
const SUPPORTED = ['en', 'es'];

export const translateMessage = async (req, res, next) => {
  try {
    const { text, target } = req.body;

    // si le texte ou la langue cible manque → erreur 400
    if (!text || !target) {
      return res.status(400).json({ message: 'text and target are required' });
    }
    // si quelqu'un essaie de traduire vers une langue non supportée → je refuse
    if (!SUPPORTED.includes(target)) {
      return res.status(400).json({ message: `target must be one of: ${SUPPORTED.join(', ')}` });
    }

    // j'appelle l'utilitaire qui gère le cache + l'appel LibreTranslate
    const translated = await translateText(String(text), target);
    // je renvoie le texte traduit au frontend
    res.status(200).json({ translated });
  } catch (error) {
    next(error);
  }
};
