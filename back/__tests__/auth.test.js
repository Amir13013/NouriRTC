process.env.ACCESS_TOKEN_SECRET = 'test-secret';

jest.mock('../Models/AuthModel.js');
jest.mock('bcrypt');

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import { getUserByMailService, createUserService, getUserByIdService } from '../Models/AuthModel.js';
import bcrypt from 'bcrypt';
import { createUser, login, getUser } from '../Controllers/AuthControllers.js';
import { authenticate } from '../middleware/authentificationJwt.js';

const buildApp = (setup) => {
  const app = express();
  app.use(express.json());
  setup(app);
  return app;
};

describe('createUser controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates user and returns 201', async () => {
    bcrypt.hash.mockResolvedValue('hashed_pw');
    createUserService.mockResolvedValue({
      id: 1, name: 'Doe', first_name: 'John', mail: 'john@test.com',
    });

    const app = buildApp(a => {
      a.post('/signup', createUser);
    });

    const res = await request(app).post('/signup').send({
      name: 'Doe', first_name: 'John', phone_number: '0600000000',
      mail: 'john@test.com', password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 12);
    expect(createUserService).toHaveBeenCalledWith(
      'Doe', 'John', '0600000000', 'john@test.com', 'hashed_pw',
    );
  });

  it('forwards error to next() on service failure', async () => {
    bcrypt.hash.mockResolvedValue('hashed_pw');
    createUserService.mockRejectedValue(new Error('DB error'));

    const app = buildApp(a => {
      a.post('/signup', createUser);
      // eslint-disable-next-line no-unused-vars
      a.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
    });

    const res = await request(app).post('/signup').send({
      name: 'Doe', first_name: 'John', phone_number: '0600000000',
      mail: 'john@test.com', password: 'secret123',
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB error');
  });
});

describe('login controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when mail is missing', async () => {
    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Champs manquants');
  });

  it('returns 400 when password is missing', async () => {
    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ mail: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user is not found', async () => {
    getUserByMailService.mockResolvedValue(null);
    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ mail: 'x@x.com', password: 'pw' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Utilisateur non trouvé');
  });

  it('returns 401 when password is incorrect', async () => {
    getUserByMailService.mockResolvedValue({
      id: 1, mail: 'x@x.com', password: 'hashed', name: 'A', first_name: 'B',
    });
    bcrypt.compare.mockResolvedValue(false);

    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ mail: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Mot de passe incorrect');
  });

  it('returns 200 with accessToken on success', async () => {
    getUserByMailService.mockResolvedValue({
      id: 1, mail: 'x@x.com', password: 'hashed', name: 'Alice', first_name: 'Bob',
    });
    bcrypt.compare.mockResolvedValue(true);

    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ mail: 'x@x.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.id).toBe(1);
  });

  it('returns 500 on unexpected error', async () => {
    getUserByMailService.mockRejectedValue(new Error('DB down'));

    const app = buildApp(a => { a.post('/login', login); });
    const res = await request(app).post('/login').send({ mail: 'x@x.com', password: 'pw' });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Erreur serveur');
  });
});

describe('getUser controller', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeToken = (payload = { id: 1 }) =>
    jwt.sign(payload, 'test-secret');

  it('returns 200 with user data', async () => {
    getUserByIdService.mockResolvedValue({ id: 1, name: 'A', first_name: 'B', mail: 'a@b.com' });

    const app = buildApp(a => {
      a.get('/me', authenticate, getUser);
      // eslint-disable-next-line no-unused-vars
      a.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
    });

    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it('returns 404 when user does not exist', async () => {
    getUserByIdService.mockResolvedValue(null);

    const app = buildApp(a => {
      a.get('/me', authenticate, getUser);
      // eslint-disable-next-line no-unused-vars
      a.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
    });

    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${makeToken({ id: 99 })}`);

    expect(res.status).toBe(404);
  });
});

describe('authenticate middleware', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const app = express();
    app.get('/test', authenticate, (_req, res) => res.sendStatus(200));

    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const app = express();
    app.get('/test', authenticate, (_req, res) => res.sendStatus(200));

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer bad.token.value');
    expect(res.status).toBe(401);
  });

  it('populates req.user and calls next() on valid token', async () => {
    const token = jwt.sign({ id: 42, mail: 'user@test.com' }, 'test-secret');

    const app = express();
    app.get('/test', authenticate, (req, res) =>
      res.json({ userId: req.user.id, mail: req.user.mail })
    );

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(42);
    expect(res.body.mail).toBe('user@test.com');
  });
});
