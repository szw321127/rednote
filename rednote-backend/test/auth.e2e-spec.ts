import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  createTestApp,
  cleanDatabase,
  createTestUser,
  getAuthToken,
} from './test-setup';

describe('Auth Module (e2e)', () => {
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          nickname: 'New User',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toMatchObject({
        email: 'newuser@example.com',
        nickname: 'New User',
        plan: 'free',
        quotaLimit: 50,
        quotaUsed: 0,
      });
      expect(res.body.user).toHaveProperty('id');
    });

    it('should register with default nickname from email', async () => {
      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.user.nickname).toBe('john');
    });

    it('should reject duplicate email', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'password123' })
        .expect(201);

      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'password456' })
        .expect(409);
    });

    it('should reject invalid email', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123' })
        .expect(400);
    });

    it('should reject missing fields', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: 'password123' });

      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject wrong password', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/register')
        .send({ email: 'wrong@example.com', password: 'password123' });

      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: 'password123' })
        .expect(401);
    });

    it('should reject invalid email format', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/login')
        .send({ email: 'bad-email', password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid JWT', async () => {
      const user = await createTestUser(ctx);
      const token = getAuthToken(ctx, user);

      const res = await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject without token', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/refresh')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile', async () => {
      const user = await createTestUser(ctx, { email: 'profile@example.com' });
      const token = getAuthToken(ctx, user);

      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('profile@example.com');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('plan');
      expect(res.body).toHaveProperty('quotaLimit');
      expect(res.body).toHaveProperty('quotaUsed');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject without token', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/auth/profile')
        .expect(401);
    });
  });
});
