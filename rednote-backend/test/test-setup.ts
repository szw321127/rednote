import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import session from 'express-session';
import { User } from '../src/database/entities/user.entity';
import { Content } from '../src/database/entities/content.entity';
import { LangchainService } from '../src/ai/services/langchain.service';
import { ImageService } from '../src/ai/services/image.service';
import { ContentQualityService } from '../src/ai/services/content-quality.service';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

export const JWT_SECRET = 'test-jwt-secret-1234567890-1234567890';
export const SESSION_SECRET = 'test-session-secret-1234567890-1234567890';

process.env.JWT_SECRET = process.env.JWT_SECRET || JWT_SECRET;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || SESSION_SECRET;
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

export interface TestContext {
  app: INestApplication;
  jwtService: JwtService;
  userRepo: Repository<User>;
  contentRepo: Repository<Content>;
  dataSource: DataSource;
}

// Mock AI services to avoid real API calls
export const mockLangchainService = {
  generateOutlines: jest.fn().mockResolvedValue([
    {
      title: 'Test Outline 1',
      content: 'Test content 1',
      emoji: '📝',
      tags: ['test'],
    },
    {
      title: 'Test Outline 2',
      content: 'Test content 2',
      emoji: '🎯',
      tags: ['test'],
    },
  ]),
  generateOutlinesStream: jest.fn().mockResolvedValue([
    {
      title: 'Test Outline 1',
      content: 'Test content 1',
      emoji: '📝',
      tags: ['test'],
    },
  ]),
  generateCaption: jest.fn().mockResolvedValue('Test caption for the outline'),
  generateImagePrompt: jest.fn().mockResolvedValue('A test image prompt'),
};

export const mockImageService = {
  generateImage: jest
    .fn()
    .mockResolvedValue('https://example.com/test-image.png'),
};

export const mockQualityService = {
  evaluateCaption: jest.fn().mockResolvedValue({
    overall: 85,
    creativity: 80,
    engagement: 90,
    clarity: 85,
    suggestions: ['Good content'],
  }),
};

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(LangchainService)
    .useValue(mockLangchainService)
    .overrideProvider(ImageService)
    .useValue(mockImageService)
    .overrideProvider(ContentQualityService)
    .useValue(mockQualityService)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.use(
    session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.init();

  const jwtService = moduleFixture.get<JwtService>(JwtService);
  const dataSource = moduleFixture.get<DataSource>(DataSource);
  const userRepo = dataSource.getRepository(User);
  const contentRepo = dataSource.getRepository(Content);

  return { app, jwtService, userRepo, contentRepo, dataSource };
}

export async function cleanDatabase(ctx: TestContext): Promise<void> {
  // Use query builder to clear tables (avoids empty criteria error)
  await ctx.contentRepo.createQueryBuilder().delete().from(Content).execute();
  await ctx.userRepo.createQueryBuilder().delete().from(User).execute();
}

export async function createTestUser(
  ctx: TestContext,
  overrides: Partial<User> = {},
): Promise<User> {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = ctx.userRepo.create({
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: hashedPassword,
    nickname: 'Test User',
    plan: 'free',
    quotaLimit: 50,
    quotaUsed: 0,
    quotaResetAt: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1,
    ),
    ...overrides,
  });
  return ctx.userRepo.save(user);
}

export function getAuthToken(ctx: TestContext, user: User): string {
  return ctx.jwtService.sign({ sub: user.id, email: user.email });
}

export function resetMocks(): void {
  mockLangchainService.generateOutlines.mockClear();
  mockLangchainService.generateOutlinesStream.mockClear();
  mockLangchainService.generateCaption.mockClear();
  mockLangchainService.generateImagePrompt.mockClear();
  mockImageService.generateImage.mockClear();
  mockQualityService.evaluateCaption.mockClear();
}
