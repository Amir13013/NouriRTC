// je garde en mémoire les traductions déjà faites pour éviter de rappeler l'API
// clé = "texte|langue", valeur = texte traduit
const cache = new Map();

export const translateText = async (text, target) => {
  // texte vide → rien à traduire
  if (!text?.trim()) return text;
  // déjà en français → je retourne direct sans appeler l'API
  if (target === 'fr') return text;

  // je construis une clé unique pour ce texte + cette langue
  const cacheKey = `${text}|${target}`;
  // si j'ai déjà traduit ce texte dans cette langue → je renvoie depuis le cache
  // ça évite de payer des appels API inutiles
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // j'appelle l'API LibreTranslate (gratuite et open source)
    // je mets un timeout de 6 secondes — si l'API répond pas → on abandonne proprement
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ q: text, source: 'fr', target, format: 'text' }),
      signal: AbortSignal.timeout(6000),
    });

    // si l'API retourne une erreur HTTP → je lance une exception → catch → fallback
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // si la traduction est vide pour une raison quelconque → je garde le texte original
    const translated = data.translatedText || text;
    // je mets en cache pour les prochains appels avec le même texte
    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    // n'importe quelle erreur (timeout, réseau, API down) → je retourne le texte original
    // l'app ne plante pas, juste le texte reste en français
    console.warn(`[translate] ${err.message} — returning original text`);
    return text;
  }
};
