import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Content } from '../database/entities/content.entity';

describe('StatsService', () => {
  let service: StatsService;
  let mockUserRepo: any;
  let mockContentRepo: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { plan: 'free', count: '10' },
          { plan: 'pro', count: '3' },
        ]),
      }),
    };

    mockContentRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Content), useValue: mockContentRepo },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe('getUserStats', () => {
    it('should return null for non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.getUserStats('non-existent');
      expect(result).toBeNull();
    });

    it('should return user stats', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        quotaUsed: 5,
        quotaLimit: 50,
        plan: 'free',
        createdAt: new Date(),
      });
      mockContentRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7); // completed

      const result = await service.getUserStats('uuid-1');
      expect(result).toBeDefined();
      expect(result!.totalGenerated).toBe(10);
      expect(result!.completedPosts).toBe(7);
      expect(result!.quotaRemaining).toBe(45);
    });
  });

  describe('getAdminStats', () => {
    it('should return admin stats', async () => {
      mockUserRepo.count.mockResolvedValue(13);
      mockContentRepo.count.mockResolvedValue(100);

      const result = await service.getAdminStats();
      expect(result.totalUsers).toBe(13);
      expect(result.totalContents).toBe(100);
      expect(result.planDistribution).toHaveLength(2);
    });
  });
});
