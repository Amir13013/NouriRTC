process.env.ACCESS_TOKEN_SECRET = 'test-secret';

jest.mock('../Models/MessageModel.js');

import request from 'supertest';
import express from 'express';

import {
  createMessageService,
  getMessagesByChannelService,
  deleteMessageService,
  editMessageService,
  toggleReactionService,
} from '../Models/MessageModel.js';

import {
  createMessage,
  getMessagesByChannel,
  deleteMessage,
  editMessage,
  reactToMessage,
} from '../Controllers/MessageControllers.js';

const buildApp = (setup) => {
  const app = express();
  app.use(express.json());
  setup(app);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
};

// Inject req.user without real JWT
const fakeAuth = (id = 1) => (req, _res, next) => {
  req.user = { id };
  next();
};

beforeEach(() => jest.clearAllMocks());

describe('createMessage controller', () => {
  it('creates a message and returns 201', async () => {
    createMessageService.mockResolvedValue({
      _id: 'msg1', userId: '1', channelId: 'ch1', content: 'Hello',
    });

    const app = buildApp(a => {
      a.post('/messages', fakeAuth(1), createMessage);
    });

    const res = await request(app).post('/messages').send({ channelId: 'ch1', content: 'Hello' });

    expect(res.status).toBe(201);
    expect(createMessageService).toHaveBeenCalledWith(1, 'ch1', 'Hello');
  });

  it('forwards error to next() on failure', async () => {
    createMessageService.mockRejectedValue(new Error('Mongo fail'));

    const app = buildApp(a => {
      a.post('/messages', fakeAuth(1), createMessage);
    });

    const res = await request(app).post('/messages').send({ channelId: 'ch1', content: 'x' });
    expect(res.status).toBe(500);
  });
});

describe('getMessagesByChannel controller', () => {
  it('returns 200 with message list', async () => {
    getMessagesByChannelService.mockResolvedValue([
      { _id: 'msg1', content: 'Hello' },
      { _id: 'msg2', content: 'World' },
    ]);

    const app = buildApp(a => { a.get('/channels/:channelId/messages', getMessagesByChannel); });
    const res = await request(app).get('/channels/ch1/messages');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('forwards error to next()', async () => {
    getMessagesByChannelService.mockRejectedValue(new Error('Mongo fail'));

    const app = buildApp(a => { a.get('/channels/:channelId/messages', getMessagesByChannel); });
    const res = await request(app).get('/channels/ch1/messages');

    expect(res.status).toBe(500);
  });
});

describe('deleteMessage controller', () => {
  it('returns 200 on successful deletion', async () => {
    deleteMessageService.mockResolvedValue({ _id: 'msg1' });

    const app = buildApp(a => { a.delete('/messages/:messageId', deleteMessage); });
    const res = await request(app).delete('/messages/msg1');

    expect(res.status).toBe(200);
  });

  it('forwards error when message not found', async () => {
    deleteMessageService.mockRejectedValue(new Error('Message non trouvé'));

    const app = buildApp(a => { a.delete('/messages/:messageId', deleteMessage); });
    const res = await request(app).delete('/messages/bad');

    expect(res.status).toBe(500);
  });
});

describe('editMessage controller', () => {
  it('returns 200 on successful edit', async () => {
    editMessageService.mockResolvedValue({ _id: 'msg1', content: 'Updated', is_edited: true });

    const app = buildApp(a => {
      a.put('/messages/:messageId', fakeAuth(1), editMessage);
    });

    const res = await request(app).put('/messages/msg1').send({ content: 'Updated' });

    expect(res.status).toBe(200);
    expect(editMessageService).toHaveBeenCalledWith('msg1', 1, 'Updated');
  });

  it('returns 400 when content is empty', async () => {
    const app = buildApp(a => {
      a.put('/messages/:messageId', fakeAuth(1), editMessage);
    });

    const res = await request(app).put('/messages/msg1').send({ content: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Contenu vide');
  });

  it('returns 403 when user is not the author', async () => {
    editMessageService.mockRejectedValue(new Error('Non autorisé'));

    const app = buildApp(a => {
      a.put('/messages/:messageId', fakeAuth(2), editMessage);
    });

    const res = await request(app).put('/messages/msg1').send({ content: 'Hijack' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when message does not exist', async () => {
    editMessageService.mockRejectedValue(new Error('Message non trouvé'));

    const app = buildApp(a => {
      a.put('/messages/:messageId', fakeAuth(1), editMessage);
    });

    const res = await request(app).put('/messages/bad').send({ content: 'Updated' });
    expect(res.status).toBe(404);
  });
});

describe('reactToMessage controller', () => {
  it('returns 200 with updated reactions', async () => {
    toggleReactionService.mockResolvedValue({
      reactions: [{ emoji: '👍', users: ['1'] }],
    });

    const app = buildApp(a => {
      a.post('/messages/:messageId/react', fakeAuth(1), reactToMessage);
    });

    const res = await request(app)
      .post('/messages/msg1/react')
      .send({ emoji: '👍' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(toggleReactionService).toHaveBeenCalledWith('msg1', 1, '👍');
  });

  it('returns 400 when emoji is missing', async () => {
    const app = buildApp(a => {
      a.post('/messages/:messageId/react', fakeAuth(1), reactToMessage);
    });

    const res = await request(app).post('/messages/msg1/react').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when message is not found', async () => {
    toggleReactionService.mockRejectedValue(new Error('Message non trouvé'));

    const app = buildApp(a => {
      a.post('/messages/:messageId/react', fakeAuth(1), reactToMessage);
    });

    const res = await request(app).post('/messages/msg1/react').send({ emoji: '❤️' });
    expect(res.status).toBe(404);
  });
});
