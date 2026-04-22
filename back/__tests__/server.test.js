process.env.ACCESS_TOKEN_SECRET = 'test-secret';

jest.mock('../Models/ServerModel.js');
jest.mock('../Models/MuteModel.js');

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import {
  getAllServerService,
  createServerService,
  getServerByInviteCodeService,
  isUserBannedFromServerService,
  addUserToServerService,
  getAllMembersByServerService,
  getServerByIdService,
  getAllUsersByServerService,
  getAllChannelByServerIdService,
  deleteUserFromServerService,
  deleteServerByIdService,
  createChannelByServerIdService,
  updateServerService,
  updateMemberRoleService,
} from '../Models/ServerModel.js';

import {
  getAllServer,
  createServer,
  joinServerWithInviteCode,
  getAllMembersByServer,
  getServer,
  getAllUsersByServer,
  getAllChannelByServerId,
  deleteUserFromServer,
  deleteServerById,
  createChannelByServerId,
  updateServer,
  updateMemberRole,
} from '../Controllers/ServerControllers.js';

const makeToken = (payload = { id: 1 }) =>
  jwt.sign(payload, 'test-secret');

const buildApp = (setup) => {
  const app = express();
  app.use(express.json());
  setup(app);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
};

const authHeader = (id = 1) => ({ Authorization: `Bearer ${makeToken({ id })}` });

// Middleware to inject req.user
const fakeAuth = (id = 1) => (req, _res, next) => {
  req.user = { id };
  next();
};

beforeEach(() => jest.clearAllMocks());

describe('getAllServer controller', () => {
  it('returns 200 with server list', async () => {
    getAllServerService.mockResolvedValue([{ id: 1, name: 'Server A' }]);

    const app = buildApp(a => { a.get('/servers', getAllServer); });
    const res = await request(app).get('/servers');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('forwards error to next()', async () => {
    getAllServerService.mockRejectedValue(new Error('DB fail'));

    const app = buildApp(a => { a.get('/servers', getAllServer); });
    const res = await request(app).get('/servers');

    expect(res.status).toBe(500);
  });
});

describe('createServer controller', () => {
  it('returns 201 on success', async () => {
    createServerService.mockResolvedValue({ id: 10, name: 'My Server', invitecode: 'abc123' });

    const app = buildApp(a => {
      a.post('/servers', fakeAuth(2), createServer);
    });

    const res = await request(app).post('/servers').send({ name: 'My Server' });

    expect(res.status).toBe(201);
    expect(createServerService).toHaveBeenCalledWith('My Server', 2, expect.any(String));
    expect(res.body.data.name).toBe('My Server');
  });

  it('forwards error to next()', async () => {
    createServerService.mockRejectedValue(new Error('DB fail'));

    const app = buildApp(a => {
      a.post('/servers', fakeAuth(2), createServer);
    });

    const res = await request(app).post('/servers').send({ name: 'Bad' });
    expect(res.status).toBe(500);
  });
});

describe('joinServerWithInviteCode controller', () => {
  it('returns 200 when join is successful', async () => {
    getServerByInviteCodeService.mockResolvedValue({ id: 5 });
    isUserBannedFromServerService.mockResolvedValue(false);
    addUserToServerService.mockResolvedValue(true);

    const app = buildApp(a => {
      a.post('/join', fakeAuth(3), joinServerWithInviteCode);
    });

    const res = await request(app).post('/join').send({ inviteCode: 'invite123' });

    expect(res.status).toBe(200);
    expect(res.body.data.serverId).toBe(5);
  });

  it('returns 404 when server not found', async () => {
    getServerByInviteCodeService.mockResolvedValue(null);

    const app = buildApp(a => {
      a.post('/join', fakeAuth(3), joinServerWithInviteCode);
    });

    const res = await request(app).post('/join').send({ inviteCode: 'bad' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is banned', async () => {
    getServerByInviteCodeService.mockResolvedValue({ id: 5 });
    isUserBannedFromServerService.mockResolvedValue(true);

    const app = buildApp(a => {
      a.post('/join', fakeAuth(3), joinServerWithInviteCode);
    });

    const res = await request(app).post('/join').send({ inviteCode: 'invite123' });
    expect(res.status).toBe(403);
  });

  it('returns 409 when already a member', async () => {
    getServerByInviteCodeService.mockResolvedValue({ id: 5 });
    isUserBannedFromServerService.mockResolvedValue(false);
    addUserToServerService.mockResolvedValue(false); // null/false = already member

    const app = buildApp(a => {
      a.post('/join', fakeAuth(3), joinServerWithInviteCode);
    });

    const res = await request(app).post('/join').send({ inviteCode: 'invite123' });
    expect(res.status).toBe(409);
  });
});

describe('getAllMembersByServer controller', () => {
  it('returns 200 with servers list', async () => {
    getAllMembersByServerService.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const app = buildApp(a => { a.get('/members', fakeAuth(1), getAllMembersByServer); });
    const res = await request(app).get('/members');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = buildApp(a => {
      a.get('/members', (req, _res, next) => { req.user = null; next(); }, getAllMembersByServer);
    });

    const res = await request(app).get('/members');
    expect(res.status).toBe(401);
  });
});

describe('getServer controller', () => {
  it('returns 200 with server data', async () => {
    getServerByIdService.mockResolvedValue({ id: 1, name: 'Test' });

    const app = buildApp(a => { a.get('/servers/:id', getServer); });
    const res = await request(app).get('/servers/1');

    expect(res.status).toBe(200);
  });

  it('returns 404 when server not found', async () => {
    getServerByIdService.mockResolvedValue(null);

    const app = buildApp(a => { a.get('/servers/:id', getServer); });
    const res = await request(app).get('/servers/999');

    expect(res.status).toBe(404);
  });
});

describe('getAllUsersByServer controller', () => {
  it('returns 200 with user list', async () => {
    getAllUsersByServerService.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const app = buildApp(a => { a.get('/servers/:serverId/users', getAllUsersByServer); });
    const res = await request(app).get('/servers/1/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 404 when query returns null', async () => {
    getAllUsersByServerService.mockResolvedValue(null);

    const app = buildApp(a => { a.get('/servers/:serverId/users', getAllUsersByServer); });
    const res = await request(app).get('/servers/1/users');

    expect(res.status).toBe(404);
  });
});

describe('getAllChannelByServerId controller', () => {
  it('returns 200 with channels', async () => {
    getAllChannelByServerIdService.mockResolvedValue([{ id: 1, name: 'general' }]);

    const app = buildApp(a => { a.get('/servers/:serverId/channels', getAllChannelByServerId); });
    const res = await request(app).get('/servers/1/channels');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('deleteUserFromServer controller', () => {
  it('returns 200 on successful removal', async () => {
    deleteUserFromServerService.mockResolvedValue(1);

    const app = buildApp(a => { a.delete('/servers/:serverId/leave', fakeAuth(1), deleteUserFromServer); });
    const res = await request(app).delete('/servers/1/leave');

    expect(res.status).toBe(200);
  });

  it('returns 404 when user not in server', async () => {
    deleteUserFromServerService.mockResolvedValue(0);

    const app = buildApp(a => { a.delete('/servers/:serverId/leave', fakeAuth(1), deleteUserFromServer); });
    const res = await request(app).delete('/servers/1/leave');

    expect(res.status).toBe(404);
  });
});

describe('deleteServerById controller', () => {
  it('returns 200 on successful deletion', async () => {
    deleteServerByIdService.mockResolvedValue({ id: 1 });

    const app = buildApp(a => { a.delete('/servers/:serverId', deleteServerById); });
    const res = await request(app).delete('/servers/1');

    expect(res.status).toBe(200);
  });

  it('returns 404 when server not found', async () => {
    deleteServerByIdService.mockResolvedValue(null);

    const app = buildApp(a => { a.delete('/servers/:serverId', deleteServerById); });
    const res = await request(app).delete('/servers/999');

    expect(res.status).toBe(404);
  });
});

describe('createChannelByServerId controller', () => {
  it('returns 200 on channel creation', async () => {
    createChannelByServerIdService.mockResolvedValue({ id: 5, name: 'new-channel' });

    const app = buildApp(a => { a.post('/servers/:serverId/channels', createChannelByServerId); });
    const res = await request(app).post('/servers/1/channels').send({ name: 'new-channel' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('new-channel');
  });

  it('returns 404 when creation fails', async () => {
    createChannelByServerIdService.mockResolvedValue(null);

    const app = buildApp(a => { a.post('/servers/:serverId/channels', createChannelByServerId); });
    const res = await request(app).post('/servers/1/channels').send({ name: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('updateServer controller', () => {
  it('returns 200 when updated', async () => {
    updateServerService.mockResolvedValue({ id: 1, name: 'New Name' });

    const app = buildApp(a => { a.put('/servers/:serverId', updateServer); });
    const res = await request(app).put('/servers/1').send({ name: 'New Name' });

    expect(res.status).toBe(200);
  });

  it('returns 404 when not found', async () => {
    updateServerService.mockResolvedValue(null);

    const app = buildApp(a => { a.put('/servers/:serverId', updateServer); });
    const res = await request(app).put('/servers/999').send({ name: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('updateMemberRole controller', () => {
  it('returns 200 on role update', async () => {
    updateMemberRoleService.mockResolvedValue({ role: 'admin' });

    const app = buildApp(a => { a.put('/servers/:serverId/members/:userId/role', updateMemberRole); });
    const res = await request(app).put('/servers/1/members/2/role').send({ role: 'admin' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when role is missing', async () => {
    const app = buildApp(a => { a.put('/servers/:serverId/members/:userId/role', updateMemberRole); });
    const res = await request(app).put('/servers/1/members/2/role').send({});

    expect(res.status).toBe(400);
  });
});
