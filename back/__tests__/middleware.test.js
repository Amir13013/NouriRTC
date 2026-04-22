process.env.ACCESS_TOKEN_SECRET = 'test-secret';

// Mock DB and ServerModel before importing checkRole (which imports them at module level)
jest.mock('../Config/DataBase.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../Models/ServerModel.js');

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import pool from '../Config/DataBase.js';
import { getUserRoleInServerService } from '../Models/ServerModel.js';
import { checkRole } from '../middleware/CheckRole.js';

const buildApp = (middleware, handler = (_req, res) => res.json({ ok: true })) => {
  const app = express();
  app.use(express.json());
  // Inject req.user (normally done by authenticate)
  app.use((req, _res, next) => {
    req.user = { id: 1 };
    next();
  });
  app.get('/test/:serverId', middleware, handler);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
};

beforeEach(() => jest.clearAllMocks());

describe('checkRole middleware', () => {
  it('passes when user has the required role', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'owner' });

    const app = buildApp(checkRole(['owner', 'admin']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 403 when user does not have the required role', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    pool.query.mockResolvedValue({ rows: [] }); // not the owner in servers table

    const app = buildApp(checkRole(['owner']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Required role/);
  });

  it('returns 403 when user is not a member of the server', async () => {
    getUserRoleInServerService.mockResolvedValue(null);
    pool.query.mockResolvedValue({ rows: [] }); // not the owner either

    const app = buildApp(checkRole(['owner', 'member']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You are not a member of this server');
  });

  it('auto-repairs role to owner when user is declared server owner but has no role', async () => {
    getUserRoleInServerService.mockResolvedValue(null);
    // First query: SELECT owner FROM servers → user IS the owner
    pool.query
      .mockResolvedValueOnce({ rows: [{ owner: '1' }] })
      // Second query: INSERT ... ON CONFLICT
      .mockResolvedValueOnce({ rows: [] });

    const app = buildApp(checkRole(['owner']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(200);
  });

  it('auto-repairs role when owner is incorrectly stored as member', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    // First query: SELECT owner → user IS the owner
    pool.query
      .mockResolvedValueOnce({ rows: [{ owner: '1' }] })
      // Second query: UPDATE role = 'owner'
      .mockResolvedValueOnce({ rows: [] });

    const app = buildApp(checkRole(['owner']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(200);
  });

  it('injects req.userRole for downstream controllers', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'admin' });

    const app = buildApp(
      checkRole(['admin', 'owner']),
      (req, res) => res.json({ role: req.userRole })
    );

    const res = await request(app).get('/test/1');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('returns 400 when serverId param is missing', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1 }; next(); });
    // Route without :serverId param → req.params.serverId is undefined
    app.get('/test', checkRole(['owner']), (_req, res) => res.json({ ok: true }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));

    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Server ID missing');
  });

  it('forwards unexpected errors to next()', async () => {
    getUserRoleInServerService.mockRejectedValue(new Error('DB crash'));

    const app = buildApp(checkRole(['owner']));
    const res = await request(app).get('/test/1');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB crash');
  });
});
