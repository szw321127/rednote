import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Content } from '../database/entities/content.entity';
import { QuotaService } from './quota.service';
import {
  QUOTA_EXCEEDED_ERROR_CODE,
  QuotaExceededException,
} from './exceptions/quota-exceeded.exception';

describe('QuotaService', () => {
  jest.setTimeout(20000);
  let moduleRef: TestingModule;
  let quotaService: QuotaService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Content],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [QuotaService],
    }).compile();

    quotaService = moduleRef.get(QuotaService);
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await userRepo.createQueryBuilder().delete().from(User).execute();
  });

  async function createUser(overrides: Partial<User> = {}): Promise<User> {
    const user = userRepo.create({
      email: `quota-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'hashed-password',
      quotaLimit: 3,
      quotaUsed: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      ...overrides,
    });

    return userRepo.save(user);
  }

  it('should throw stable quota error when affected=0 (quota reached)', async () => {
    const user = await createUser({ quotaLimit: 1, quotaUsed: 1 });

    const error = await quotaService.consumeQuota(user.id).catch((e) => e);

    expect(error).toBeInstanceOf(QuotaExceededException);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({
      code: QUOTA_EXCEEDED_ERROR_CODE,
    });
  });

  it('should cap usage at quota limit across repeated deductions', async () => {
    const user = await createUser({ quotaLimit: 3, quotaUsed: 0 });

    await quotaService.consumeQuota(user.id);
    await quotaService.consumeQuota(user.id);
    await quotaService.consumeQuota(user.id);

    const error = await quotaService.consumeQuota(user.id).catch((e) => e);
    expect(error.getResponse()).toMatchObject({ code: QUOTA_EXCEEDED_ERROR_CODE });

    const updated = await userRepo.findOne({ where: { id: user.id } });
    expect(updated?.quotaUsed).toBe(3);
  });

  it('should reset overdue quota before deducting', async () => {
    const user = await createUser({
      quotaLimit: 2,
      quotaUsed: 2,
      quotaResetAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    await quotaService.consumeQuota(user.id);

    const updated = await userRepo.findOne({ where: { id: user.id } });
    expect(updated?.quotaUsed).toBe(1);
    expect(updated?.quotaResetAt).toBeInstanceOf(Date);
  });
});
