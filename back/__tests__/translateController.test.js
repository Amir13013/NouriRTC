process.env.ACCESS_TOKEN_SECRET = 'test-secret';

jest.mock('../utils/translate.js');

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import { translateText } from '../utils/translate.js';
import { translateMessage } from '../Controllers/TranslateControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/translate', authenticate, translateMessage);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
};

const token = jwt.sign({ id: 1 }, 'test-secret');
const auth = { Authorization: `Bearer ${token}` };

beforeEach(() => jest.clearAllMocks());

describe('translateMessage controller', () => {
  it('returns 400 when text is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/translate').set(auth).send({ target: 'en' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('text and target are required');
  });

  it('returns 400 when target is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/translate').set(auth).send({ text: 'Bonjour' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('text and target are required');
  });

  it('returns 400 when target language is not supported', async () => {
    const app = buildApp();
    const res = await request(app).post('/translate').set(auth).send({ text: 'Bonjour', target: 'de' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/target must be one of/i);
  });

  it('returns 200 with translated text for "en"', async () => {
    translateText.mockResolvedValue('Hello');

    const app = buildApp();
    const res = await request(app).post('/translate').set(auth).send({ text: 'Bonjour', target: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.translated).toBe('Hello');
    expect(translateText).toHaveBeenCalledWith('Bonjour', 'en');
  });

  it('returns 200 with translated text for "es"', async () => {
    translateText.mockResolvedValue('Hola');

    const app = buildApp();
    const res = await request(app).post('/translate').set(auth).send({ text: 'Bonjour', target: 'es' });

    expect(res.status).toBe(200);
    expect(res.body.translated).toBe('Hola');
  });

  it('returns 401 when no auth token provided', async () => {
    const app = buildApp();
    const res = await request(app).post('/translate').send({ text: 'Hello', target: 'en' });
    expect(res.status).toBe(401);
  });
});
