import { translateText } from '../utils/translate.js';

// Mock global fetch before any test runs
global.fetch = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe('translateText utility', () => {
  it('returns the original text when input is empty', async () => {
    const result = await translateText('', 'en');
    expect(result).toBe('');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the original text when input is only whitespace', async () => {
    const result = await translateText('   ', 'en');
    expect(result).toBe('   ');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the original text when target is "fr" (no-op)', async () => {
    const result = await translateText('Bonjour', 'fr');
    expect(result).toBe('Bonjour');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls LibreTranslate and returns translated text', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ translatedText: 'Hello' }),
    });

    // Use unique text to avoid cache collision with other tests
    const result = await translateText('Salut monde', 'en');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://libretranslate.de/translate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ q: 'Salut monde', source: 'fr', target: 'en', format: 'text' }),
      })
    );
    expect(result).toBe('Hello');
  });

  it('falls back to the original text when the API returns a non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // Unique text to avoid cache hit
    const result = await translateText('Au revoir monde', 'en');
    expect(result).toBe('Au revoir monde');
  });

  it('falls back to original text when fetch throws (network error)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network failure'));

    // Unique text to avoid cache hit
    const result = await translateText('Bonne nuit monde', 'es');
    expect(result).toBe('Bonne nuit monde');
  });

  it('returns original when translatedText is falsy in response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ translatedText: null }),
    });

    // Unique text to avoid cache hit
    const result = await translateText('Nouveau texte unique', 'en');
    // null translatedText → falls back to original
    expect(result).toBe('Nouveau texte unique');
  });

  it('caches the result and does not call fetch twice for the same key', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: 'Thank you' }),
    });

    // Unique text so it's definitely not in cache from earlier tests
    const first = await translateText('Merci beaucoup monsieur', 'en');
    const second = await translateText('Merci beaucoup monsieur', 'en');

    expect(first).toBe('Thank you');
    expect(second).toBe('Thank you');
    // fetch should only be called once — second call hits the in-memory cache
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// TranslateControllers are tested in translateController.test.js
