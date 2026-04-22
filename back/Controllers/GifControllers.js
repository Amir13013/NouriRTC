const TENOR_BASE = 'https://tenor.googleapis.com/v2';

export const searchGifs = async (req, res, next) => {
  try {
    // je récupère le terme de recherche tapé par l'utilisateur
    const q = (req.query.q || '').trim();
    // par défaut je renvoie 16 GIFs max
    const limit = parseInt(req.query.limit) || 16;
    // si la recherche est vide → je renvoie un tableau vide directement
    if (!q) return res.status(200).json({ data: [] });

    // la clé API Tenor est dans les variables d'env — jamais dans le code source
    const apiKey = process.env.TENOR_API_KEY;
    // si la clé manque → je renvoie vide plutôt que de planter
    if (!apiKey) return res.status(200).json({ data: [], error: "TENOR_API_KEY manquante" });

    // j'encode le texte de recherche pour l'URL (les espaces etc.)
    const url = `${TENOR_BASE}/search?q=${encodeURIComponent(q)}&key=${apiKey}&limit=${limit}&media_filter=gif`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Tenor API error");

    const data = await response.json();
    // je filtre les données de Tenor pour garder uniquement ce dont le frontend a besoin
    // tinygif = version légère pour la prévisualisation dans la liste
    const gifs = (data.results || []).map(r => ({
      id: r.id,
      title: r.title,
      url: r.media_formats?.gif?.url || '',         // URL du GIF en taille réelle
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',  // version légère
    }));
    res.status(200).json({ data: gifs });
  } catch (error) { next(error); }
};

export const trendingGifs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 16;
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) return res.status(200).json({ data: [], error: "TENOR_API_KEY manquante" });

    // même logique que searchGifs mais je prends les GIFs tendance (featured) de Tenor
    const url = `${TENOR_BASE}/featured?key=${apiKey}&limit=${limit}&media_filter=gif`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Tenor API error");

    const data = await response.json();
    const gifs = (data.results || []).map(r => ({
      id: r.id,
      title: r.title,
      url: r.media_formats?.gif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
    }));
    res.status(200).json({ data: gifs });
  } catch (error) { next(error); }
};
