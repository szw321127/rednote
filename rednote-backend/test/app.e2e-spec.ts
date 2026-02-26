import request from 'supertest';
import { App } from 'supertest/types';
import { TestContext, createTestApp } from './test-setup';

describe('AppController (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('/ (GET)', () => {
    return request(ctx.app.getHttpServer() as App)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
