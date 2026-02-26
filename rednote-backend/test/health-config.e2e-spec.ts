import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  createTestApp,
  cleanDatabase,
  createTestUser,
  getAuthToken,
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

  describe('Config endpoints auth & isolation', () => {
    it('should require authentication for save/get/stats', async () => {
      const server = ctx.app.getHttpServer() as App;

      await request(server)
        .post('/api/config/save')
        .send({ config: { activeTextModelId: 'gemini-pro' } })
        .expect(401);

      await request(server).get('/api/config/get').expect(401);

      await request(server).get('/api/config/stats').expect(401);
    });

    it('should isolate configs by authenticated userId', async () => {
      const server = ctx.app.getHttpServer() as App;
      const userA = await createTestUser(ctx);
      const userB = await createTestUser(ctx);
      const tokenA = getAuthToken(ctx, userA);
      const tokenB = getAuthToken(ctx, userB);

      await request(server)
        .post('/api/config/save')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          config: {
            activeTextModelId: 'gemini-pro',
            models: [
              {
                id: 'm1',
                name: 'gemini',
                displayName: 'Gemini',
                apiKey: 'secret-key-should-not-be-returned',
              },
            ],
          },
        })
        .expect(201);

      const ownConfigRes = await request(server)
        .get('/api/config/get')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(ownConfigRes.body.success).toBe(true);
      expect(ownConfigRes.body.config.activeTextModelId).toBe('gemini-pro');
      expect(ownConfigRes.body.config.models[0].apiKey).toBeUndefined();

      const otherUserRes = await request(server)
        .get('/api/config/get')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(otherUserRes.body.success).toBe(false);
      expect(otherUserRes.body.config).toBeNull();
    });
  });
});
