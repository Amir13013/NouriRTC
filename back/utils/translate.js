// cache: évite de rappeler l'API pour un texte déjà traduit — clé = "texte|langue"
const cache = new Map();

export const translateText = async (text, target) => {
  if (!text?.trim()) return text;
  if (target === 'fr') return text;

  const cacheKey = `${text}|${target}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // liste de fallbacks — on essaie dans l'ordre jusqu'à ce qu'un endpoint réponde
    const ENDPOINTS = [
      'https://translate.argosopentech.com/translate',
      'https://translate.fedilab.app/translate',
      'https://lt.vern.cc/translate',
    ];

    let res;
    let lastErr;
    for (const url of ENDPOINTS) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ q: text, source: 'fr', target, format: 'text', api_key: '' }),
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) break;
        lastErr = new Error(`HTTP ${res.status} from ${url}`);
      } catch (e) {
        lastErr = e;
        res = undefined;
      }
    }
    if (!res?.ok) throw lastErr ?? new Error('all endpoints failed');

    const data = await res.json();
    const translated = data.translatedText || text;
    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.warn(`[translate] ${err.message} — returning original text`);
    return text;
  }
};
