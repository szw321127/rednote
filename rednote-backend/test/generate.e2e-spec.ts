import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  createTestApp,
  cleanDatabase,
  createTestUser,
  getAuthToken,
  resetMocks,
  mockLangchainService,
} from './test-setup';

describe('Generate Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(ctx);
    resetMocks();
  });

  // Helper to set session model config and return cookies
  async function setupSession(server: any): Promise<string[]> {
    const res = await request(server)
      .post('/api/session/set-model-config')
      .send({
        textModelConfig: {
          provider: 'google',
          modelName: 'gemini-pro',
          apiKey: 'test-key',
        },
        imageModelConfig: {
          provider: 'openai',
          modelName: 'dall-e-3',
          apiKey: 'test-key',
        },
        parameters: { temperature: 0.7 },
      });
    return res.headers['set-cookie'] || [];
  }

  describe('POST /api/generate/outline', () => {
    it('should generate outlines with session config (no auth)', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      const res = await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .send({ topic: 'Test Topic' })
        .expect(201);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('content');
      expect(mockLangchainService.generateOutlines).toHaveBeenCalledTimes(1);
    });

    it('should generate outlines with auth and deduct quota', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 0, quotaLimit: 50 });
      const token = getAuthToken(ctx, user);

      await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'Auth Topic' })
        .expect(201);

      // Verify quota was deducted
      const updatedUser = await ctx.userRepo.findOne({
        where: { id: user.id },
      });
      expect(updatedUser!.quotaUsed).toBe(1);
    });

    it('should persist content when authenticated', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx);
      const token = getAuthToken(ctx, user);

      await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'Persist Topic' })
        .expect(201);

      const contents = await ctx.contentRepo.find({
        where: { userId: user.id },
      });
      expect(contents.length).toBe(1);
      expect(contents[0].topic).toBe('Persist Topic');
      expect(contents[0].status).toBe('outline');
    });

    it('should reject when no session config', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/generate/outline')
        .send({ topic: 'No Config Topic' })
        .expect(400);
    });

    it('should reject missing topic', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .send({})
        .expect(400);
    });

    it('should reject when quota exceeded', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 50, quotaLimit: 50 });
      const token = getAuthToken(ctx, user);

      const res = await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'Over Quota' })
        .expect(400);

      expect(res.body.code).toBe('QUOTA_EXCEEDED');
    });

    it('should allow unauthenticated users without quota check', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      // No auth token - should work without quota check
      const res = await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .send({ topic: 'Anonymous Topic' })
        .expect(201);

      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/generate/content', () => {
    const testOutline = {
      title: 'Test Title',
      content: 'Test content body',
      emoji: '📝',
      tags: ['test', 'e2e'],
    };

    it('should generate content with session config', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      const res = await request(server)
        .post('/api/generate/content')
        .set('Cookie', cookies)
        .send({ outline: testOutline })
        .expect(201);

      expect(res.body).toHaveProperty('imageUrl');
      expect(res.body).toHaveProperty('caption');
    });

    it('should deduct quota for authenticated user', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 10 });
      const token = getAuthToken(ctx, user);

      await request(server)
        .post('/api/generate/content')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ outline: testOutline })
        .expect(201);

      const updatedUser = await ctx.userRepo.findOne({
        where: { id: user.id },
      });
      expect(updatedUser!.quotaUsed).toBe(11);
    });

    it('should reject when no session config', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/generate/content')
        .send({ outline: testOutline })
        .expect(400);
    });

    it('should reject missing outline', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      await request(server)
        .post('/api/generate/content')
        .set('Cookie', cookies)
        .send({})
        .expect(400);
    });

    it('should reject malformed nested outline payload', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);

      await request(server)
        .post('/api/generate/content')
        .set('Cookie', cookies)
        .send({
          outline: {
            title: 'bad outline',
            content: 'missing emoji and invalid tags',
            tags: [],
          },
        })
        .expect(400);
    });

    it('should reject when quota exceeded', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 50, quotaLimit: 50 });
      const token = getAuthToken(ctx, user);

      const res = await request(server)
        .post('/api/generate/content')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ outline: testOutline })
        .expect(400);

      expect(res.body.code).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('Quota System', () => {
    it('should track quota across multiple requests', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 0, quotaLimit: 3 });
      const token = getAuthToken(ctx, user);

      // Use 3 quota
      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/api/generate/outline')
          .set('Cookie', cookies)
          .set('Authorization', `Bearer ${token}`)
          .send({ topic: `Topic ${i}` })
          .expect(201);
      }

      // 4th request should fail
      const overLimitRes = await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'Over limit' })
        .expect(400);

      expect(overLimitRes.body.code).toBe('QUOTA_EXCEEDED');

      const updatedUser = await ctx.userRepo.findOne({
        where: { id: user.id },
      });
      expect(updatedUser!.quotaUsed).toBe(3);
    });

    it('should reset quota when reset date has passed', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      // Set quotaResetAt to the past
      const pastDate = new Date('2020-01-01');
      const user = await createTestUser(ctx, {
        quotaUsed: 50,
        quotaLimit: 50,
        quotaResetAt: pastDate,
      });
      const token = getAuthToken(ctx, user);

      // Should succeed because quota resets
      await request(server)
        .post('/api/generate/outline')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'After Reset' })
        .expect(201);
    });

    it('should keep quota bounded under concurrent requests', async () => {
      const server = ctx.app.getHttpServer() as App;
      const cookies = await setupSession(server);
      const user = await createTestUser(ctx, { quotaUsed: 0, quotaLimit: 1 });
      const token = getAuthToken(ctx, user);

      const settled = await Promise.allSettled(
        Array.from({ length: 3 }, (_, i) =>
          request(server)
            .post('/api/generate/outline')
            .set('Cookie', cookies)
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: `Concurrent ${i}` }),
        ),
      );

      const responses = settled
        .filter(
          (item): item is PromiseFulfilledResult<any> =>
            item.status === 'fulfilled',
        )
        .map((item) => item.value);

      expect(responses).toHaveLength(3);

      const success = responses.filter((res) => res.status === 201);
      const failed = responses.filter((res) => res.status === 400);

      expect(success).toHaveLength(1);
      expect(failed).toHaveLength(2);
      failed.forEach((res) => {
        expect(res.body.code).toBe('QUOTA_EXCEEDED');
      });

      const updated = await ctx.userRepo.findOne({ where: { id: user.id } });
      expect(updated?.quotaUsed).toBe(1);
    });
  });
});
