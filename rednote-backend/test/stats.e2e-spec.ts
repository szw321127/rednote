import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  createTestApp,
  cleanDatabase,
  createTestUser,
  getAuthToken,
} from './test-setup';
import { UserRole } from '../src/database/entities/user.entity';

describe('Stats Module (e2e)', () => {
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

  describe('GET /api/stats/me', () => {
    it('should return user stats', async () => {
      const user = await createTestUser(ctx, {
        quotaUsed: 5,
        quotaLimit: 50,
      });
      const token = getAuthToken(ctx, user);

      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        totalGenerated: 0,
        completedPosts: 0,
        quotaUsed: 5,
        quotaLimit: 50,
        quotaRemaining: 45,
        plan: 'free',
      });
      expect(res.body).toHaveProperty('memberSince');
    });

    it('should count user contents', async () => {
      const user = await createTestUser(ctx);
      const token = getAuthToken(ctx, user);

      // Create some content records
      await ctx.contentRepo.save([
        {
          userId: user.id,
          topic: 'Topic 1',
          status: 'outline',
          outlines: [{ title: 'T1', content: 'C1', emoji: '📝', tags: ['t'] }],
        },
        {
          userId: user.id,
          topic: 'Topic 2',
          status: 'completed',
          outlines: [{ title: 'T2', content: 'C2', emoji: '🎯', tags: ['t'] }],
        },
      ]);

      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.totalGenerated).toBe(2);
      expect(res.body.completedPosts).toBe(1);
    });

    it('should reject without auth', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/me')
        .expect(401);
    });
  });

  describe('GET /api/stats/admin', () => {
    it('should return admin stats for admin users', async () => {
      await createTestUser(ctx, { plan: 'free' });
      await createTestUser(ctx, { plan: 'pro' });

      const adminUser = await createTestUser(ctx, {
        plan: 'enterprise',
        role: UserRole.ADMIN,
      });
      const token = getAuthToken(ctx, adminUser);

      const res = await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.totalUsers).toBe(3);
      expect(res.body.totalContents).toBe(0);
      expect(res.body.planDistribution).toBeInstanceOf(Array);
      expect(res.body.planDistribution.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for non-admin users', async () => {
      const user = await createTestUser(ctx, { role: UserRole.USER });
      const token = getAuthToken(ctx, user);

      await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/stats/admin')
        .expect(401);
    });
  });
});
