process.env.ACCESS_TOKEN_SECRET = 'test-secret';

jest.mock('../Models/ServerModel.js');
jest.mock('../Models/MuteModel.js');

import request from 'supertest';
import express from 'express';

import {
  getUserRoleInServerService,
  deleteUserFromServerService,
  banUserFromServerService,
  isUserBannedFromServerService,
  getAllChannelByServerIdService,
} from '../Models/ServerModel.js';

import { muteUserService, isUserMutedService, unmuteUserService } from '../Models/MuteModel.js';

import {
  kickUserFromServer,
  banUserFromServer,
  muteUser,
  unmuteUser,
  getMuteStatus,
} from '../Controllers/ServerControllers.js';

const buildApp = (setup) => {
  const app = express();
  app.use(express.json());
  setup(app);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
};

// Inject req.user and req.userRole (normally set by authenticate + checkRole)
const fakeUser = (id, role) => (req, _res, next) => {
  req.user = { id };
  req.userRole = role;
  next();
};

beforeEach(() => jest.clearAllMocks());

// ─── KICK ────────────────────────────────────────────────────────────────────

describe('kickUserFromServer controller', () => {
  it('returns 200 when owner kicks a member', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    deleteUserFromServerService.mockResolvedValue(1);
    getAllChannelByServerIdService.mockResolvedValue([]);

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'owner'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/2/kick');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User kicked from server');
  });

  it('returns 200 when admin kicks a member', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    deleteUserFromServerService.mockResolvedValue(1);
    getAllChannelByServerIdService.mockResolvedValue([]);

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'admin'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/2/kick');
    expect(res.status).toBe(200);
  });

  it('returns 404 when target user is not in the server', async () => {
    getUserRoleInServerService.mockResolvedValue(null);

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'owner'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/99/kick');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found in this server');
  });

  it('returns 403 when trying to kick the owner', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'owner' });

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'owner'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/2/kick');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Cannot kick the owner');
  });

  it('returns 403 when admin tries to kick another admin', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'admin' });

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'admin'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/2/kick');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Only the owner can kick an admin');
  });

  it('returns 404 when deleteUserFromServerService returns falsy', async () => {
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    deleteUserFromServerService.mockResolvedValue(0);

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/kick',
        fakeUser(1, 'owner'),
        kickUserFromServer
      );
    });

    const res = await request(app).delete('/servers/1/members/2/kick');
    expect(res.status).toBe(404);
  });
});

// ─── BAN ─────────────────────────────────────────────────────────────────────

describe('banUserFromServer controller', () => {
  it('returns 200 when owner bans a member', async () => {
    isUserBannedFromServerService.mockResolvedValue(false);
    getUserRoleInServerService.mockResolvedValue({ role: 'member' });
    deleteUserFromServerService.mockResolvedValue(1);
    banUserFromServerService.mockResolvedValue({ id: 'ban1' });
    getAllChannelByServerIdService.mockResolvedValue([]);

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'owner'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/2/ban')
      .send({ reason: 'Spamming' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User banned from server');
  });

  it('returns 400 when user is already banned', async () => {
    isUserBannedFromServerService.mockResolvedValue(true);

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'owner'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/2/ban').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User is already banned from this server');
  });

  it('returns 403 when trying to ban the owner', async () => {
    isUserBannedFromServerService.mockResolvedValue(false);
    getUserRoleInServerService.mockResolvedValue({ role: 'owner' });

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'owner'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/2/ban').send({});
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Cannot ban the owner');
  });

  it('returns 403 when admin tries to ban another admin', async () => {
    isUserBannedFromServerService.mockResolvedValue(false);
    getUserRoleInServerService.mockResolvedValue({ role: 'admin' });

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'admin'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/2/ban').send({});
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Only the owner can ban an admin');
  });

  it('returns 200 when banning a user not in the server', async () => {
    isUserBannedFromServerService.mockResolvedValue(false);
    getUserRoleInServerService.mockResolvedValue(null); // not in server
    banUserFromServerService.mockResolvedValue({ id: 'ban1' });

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'owner'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/99/ban').send({});
    expect(res.status).toBe(200);
  });

  it('returns 500 when ban service fails', async () => {
    isUserBannedFromServerService.mockResolvedValue(false);
    getUserRoleInServerService.mockResolvedValue(null);
    banUserFromServerService.mockResolvedValue(null);

    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/ban',
        fakeUser(1, 'owner'),
        banUserFromServer
      );
    });

    const res = await request(app).post('/servers/1/members/99/ban').send({});
    expect(res.status).toBe(500);
  });
});

// ─── MUTE ────────────────────────────────────────────────────────────────────

describe('muteUser controller', () => {
  it('returns 200 when mute is applied', async () => {
    const expiresAt = new Date(Date.now() + 60000).toISOString();
    muteUserService.mockResolvedValue(expiresAt);

    const app = buildApp(a => {
      // Attach a dummy io object
      a.use((req, _res, next) => { req.app.set('io', null); next(); });
      a.post('/servers/:serverId/members/:userId/mute',
        fakeUser(1, 'owner'),
        muteUser
      );
    });

    const res = await request(app)
      .post('/servers/1/members/2/mute')
      .send({ duration: 60000 });

    expect(res.status).toBe(200);
    expect(res.body.data.expiresAt).toBe(expiresAt);
  });

  it('returns 400 when duration is missing or invalid', async () => {
    const app = buildApp(a => {
      a.post('/servers/:serverId/members/:userId/mute',
        fakeUser(1, 'owner'),
        muteUser
      );
    });

    const res = await request(app)
      .post('/servers/1/members/2/mute')
      .send({ duration: -1 });

    expect(res.status).toBe(400);
  });
});

describe('unmuteUser controller', () => {
  it('returns 200 on unmute', async () => {
    unmuteUserService.mockResolvedValue();

    const app = buildApp(a => {
      a.delete('/servers/:serverId/members/:userId/mute',
        fakeUser(1, 'owner'),
        unmuteUser
      );
    });

    const res = await request(app).delete('/servers/1/members/2/mute');
    expect(res.status).toBe(200);
  });
});

describe('getMuteStatus controller', () => {
  it('returns 200 with mute status', async () => {
    isUserMutedService.mockResolvedValue({ muted: false });

    const app = buildApp(a => {
      a.get('/servers/:serverId/mute-status',
        fakeUser(1, 'member'),
        getMuteStatus
      );
    });

    const res = await request(app).get('/servers/1/mute-status');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ muted: false });
  });
});
