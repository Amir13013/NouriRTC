const TENOR_BASE = 'https://tenor.googleapis.com/v2';

export const searchGifs = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = parseInt(req.query.limit) || 16;
    if (!q) return res.status(200).json({ data: [] });

    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) return res.status(200).json({ data: [], error: "TENOR_API_KEY manquante" });

    const url = `${TENOR_BASE}/search?q=${encodeURIComponent(q)}&key=${apiKey}&limit=${limit}&media_filter=gif`;
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

export const trendingGifs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 16;
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) return res.status(200).json({ data: [], error: "TENOR_API_KEY manquante" });

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
