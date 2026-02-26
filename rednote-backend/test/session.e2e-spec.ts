import request from 'supertest';
import { App } from 'supertest/types';
import { TestContext, createTestApp, cleanDatabase } from './test-setup';

describe('Session Module (e2e)', () => {
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

  describe('POST /api/session/set-model-config', () => {
    it('should save model config to session', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
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
          parameters: {
            temperature: 0.7,
            topP: 0.9,
          },
        })
        .expect(201);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Model configuration saved to session',
      });
    });

    it('should accept partial config (text only)', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({
          textModelConfig: {
            provider: 'google',
            modelName: 'gemini-pro',
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should accept partial config (image only)', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({
          imageModelConfig: {
            provider: 'openai',
            modelName: 'dall-e-3',
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should accept empty body', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({})
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should fill API key from env when empty', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({
          textModelConfig: {
            provider: 'google',
            modelName: 'gemini-pro',
            apiKey: '',
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject unallowlisted baseUrl', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({
          textModelConfig: {
            provider: 'openai',
            modelName: 'gpt-4o-mini',
            baseUrl: 'https://evil.example.com',
          },
        })
        .expect(400);
    });

    it('should reject custom path override', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/session/set-model-config')
        .send({
          textModelConfig: {
            provider: 'google',
            modelName: 'gemini-2.5-flash',
            path: '/v1beta/models/custom:generateContent',
          },
        })
        .expect(400);
    });
  });
});
