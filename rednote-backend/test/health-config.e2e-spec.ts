import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  createTestApp,
  cleanDatabase,
} from './test-setup';

describe('Health & Config Storage (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(ctx);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/health')
        .expect(200);

      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'rednote-backend',
      });
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /', () => {
    it('should return Hello World', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('POST /api/config/save', () => {
    it('should save config successfully', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/config/save')
        .send({
          fingerprint: 'test-fingerprint-12345',
          config: {
            backendUrl: 'http://localhost:3000',
            activeTextModelId: 'gemini-pro',
            temperature: 0.7,
          },
        })
        .expect(201);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Configuration saved successfully',
      });
      expect(res.body.config).toHaveProperty('fingerprint', 'test-fingerprint-12345');
    });

    it('should reject missing fingerprint', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/config/save')
        .send({ config: { backendUrl: 'http://localhost:3000' } })
        .expect(400);
    });

    it('should reject missing config', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/config/save')
        .send({ fingerprint: 'test-fp' })
        .expect(400);
    });

    it('should update existing config', async () => {
      const server = ctx.app.getHttpServer() as App;

      await request(server)
        .post('/api/config/save')
        .send({
          fingerprint: 'update-fp-123456789',
          config: { temperature: 0.5 },
        })
        .expect(201);

      const res = await request(server)
        .post('/api/config/save')
        .send({
          fingerprint: 'update-fp-123456789',
          config: { temperature: 0.9, topP: 0.8 },
        })
        .expect(201);

      expect(res.body.config.temperature).toBe(0.9);
      expect(res.body.config.topP).toBe(0.8);
    });
  });

  describe('GET /api/config/get', () => {
    it('should get saved config', async () => {
      const server = ctx.app.getHttpServer() as App;

      await request(server)
        .post('/api/config/save')
        .send({
          fingerprint: 'get-test-fp-12345',
          config: { activeTextModelId: 'gpt-4' },
        });

      const res = await request(server)
        .get('/api/config/get')
        .query({ fingerprint: 'get-test-fp-12345' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.config.activeTextModelId).toBe('gpt-4');
    });

    it('should return null for unknown fingerprint', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/config/get')
        .query({ fingerprint: 'unknown-fp-12345' })
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.config).toBeNull();
    });

    it('should reject missing fingerprint', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/config/get')
        .expect(400);
    });
  });

  describe('GET /api/config/stats', () => {
    it('should return config stats', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/config/stats')
        .expect(200);

      expect(res.body).toHaveProperty('totalConfigs');
      expect(typeof res.body.totalConfigs).toBe('number');
      expect(res.body).toHaveProperty('message');
    });
  });
});
