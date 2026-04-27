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
      json: async () => ({ translatedText: 'Hello everyone' }),
    });

    const result = await translateText('Salut tout le monde', 'en');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://libretranslate.de/translate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ q: 'Salut tout le monde', source: 'fr', target: 'en', format: 'text' }),
      })
    );
    expect(result).toBe('Hello');
  });

  it('falls back to the original text when the API returns a non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    
    const result = await translateText('Au revoir tout le monde', 'en');
    expect(result).toBe('Au revoir tout le monde');
  });

  it('falls back to original text when fetch throws (network error)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network failure'));

    
    const result = await translateText('Bonne nuit tout le monde', 'es');
    expect(result).toBe('Bonne nuit tout le monde');
  });

  it('returns original when translatedText is falsy in response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ translatedText: null }),
    });

    const result = await translateText('Nouveau texte unique', 'en');
    expect(result).toBe('Nouveau texte unique');
  });

  it('caches the result and does not call fetch twice for the same key', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: 'Thank you' }),
    });

    const first = await translateText('Merci beaucoup monsieur', 'en');
    const second = await translateText('Merci beaucoup monsieur', 'en');

    expect(first).toBe('Thank you');
    expect(second).toBe('Thank you');
    // fetch should only be called once — second call hits the in-memory cache
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// TranslateControllers are tested in translateController.test.js
