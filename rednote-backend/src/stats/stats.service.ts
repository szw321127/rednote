import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Content } from '../database/entities/content.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
  ) {}

  async getUserStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const totalContents = await this.contentRepo.count({
      where: { userId },
    });

    const completedContents = await this.contentRepo.count({
      where: { userId, status: 'completed' },
    });

    return {
      totalGenerated: totalContents,
      completedPosts: completedContents,
      quotaUsed: user.quotaUsed,
      quotaLimit: user.quotaLimit,
      quotaRemaining: Math.max(0, user.quotaLimit - user.quotaUsed),
      plan: user.plan,
      memberSince: user.createdAt,
    };
  }

  async getAdminStats() {
    const totalUsers = await this.userRepo.count();
    const totalContents = await this.contentRepo.count();

    // Users by plan
    const planDistribution = await this.userRepo
      .createQueryBuilder('user')
      .select('user.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.plan')
      .getRawMany();

    return {
      totalUsers,
      totalContents,
      planDistribution,
    };
  }
}
