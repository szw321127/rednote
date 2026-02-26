import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { QuotaExceededException } from './exceptions/quota-exceeded.exception';

@Injectable()
export class QuotaService {
  constructor(private readonly dataSource: DataSource) {}

  async consumeQuota(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const now = new Date();

      await manager
        .createQueryBuilder()
        .update(User)
        .set({
          quotaUsed: 0,
          quotaResetAt: this.getNextMonthStart(now),
        })
        .where('id = :userId', { userId })
        .andWhere('quotaResetAt IS NOT NULL')
        .andWhere('quotaResetAt <= :now', { now: now.toISOString() })
        .execute();

      const deductResult = await manager
        .createQueryBuilder()
        .update(User)
        .set({
          quotaUsed: () => 'quotaUsed + 1',
        })
        .where('id = :userId', { userId })
        .andWhere('quotaUsed + 1 <= quotaLimit')
        .execute();

      if (deductResult.affected && deductResult.affected > 0) {
        return;
      }

      const currentUser = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!currentUser) {
        return;
      }

      throw new QuotaExceededException(currentUser.quotaLimit);
    });
  }

  private getNextMonthStart(baseDate: Date): Date {
    return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  }
}
