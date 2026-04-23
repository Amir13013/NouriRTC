const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';

export const searchGifs = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = parseInt(req.query.limit) || 16;
    if (!q) return res.status(200).json({ data: [] });

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) return res.status(200).json({ data: [], error: 'GIPHY_API_KEY manquante' });

    const url = `${GIPHY_BASE}/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g&lang=fr`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Giphy API error');

    const data = await response.json();
    const gifs = (data.data || []).map(r => ({
      id: r.id,
      title: r.title,
      url:     r.images?.original?.url || '',
      preview: r.images?.fixed_height_downsampled?.url || r.images?.downsized?.url || r.images?.original?.url || '',
    }));
    res.status(200).json({ data: gifs });
  } catch (error) { next(error); }
};

export const trendingGifs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 16;
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) return res.status(200).json({ data: [], error: 'GIPHY_API_KEY manquante' });

    const url = `${GIPHY_BASE}/trending?api_key=${apiKey}&limit=${limit}&rating=g`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Giphy API error');

    const data = await response.json();
    const gifs = (data.data || []).map(r => ({
      id: r.id,
      title: r.title,
      url:     r.images?.original?.url || '',
      preview: r.images?.fixed_height_downsampled?.url || r.images?.downsized?.url || r.images?.original?.url || '',
    }));
    res.status(200).json({ data: gifs });
  } catch (error) { next(error); }
};
