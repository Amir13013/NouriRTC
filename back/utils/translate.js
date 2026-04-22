// In-memory cache: "<text>|<target>" -> translatedText
const cache = new Map();

/**
 * Translate text from French to the target language using LibreTranslate.
 * Falls back to the original text if the API is unavailable.
 *
 * @param {string} text   - Text to translate (assumed French source)
 * @param {string} target - Target language code: 'en' | 'es'
 * @returns {Promise<string>} Translated text (or original on failure)
 */
export const translateText = async (text, target) => {
  if (!text?.trim()) return text;
  if (target === 'fr') return text; // no-op: already French

  const cacheKey = `${text}|${target}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ q: text, source: 'fr', target, format: 'text' }),
      signal: AbortSignal.timeout(6000), // 6 s timeout
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const translated = data.translatedText || text;
    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.warn(`[translate] ${err.message} — returning original text`);
    return text; // graceful fallback
  }
};
