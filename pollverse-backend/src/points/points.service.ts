import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  PointTransaction,
  ActionType,
} from './entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointTransaction)
    private pointTransactionRepository: Repository<PointTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  private getLevel(points: number): number {
    if (points < 100) return 1;
    if (points < 1000) return 1 + Math.floor(points / 111);
    return 10 + Math.floor((points - 1000) / 225);
  }

  private getTitle(level: number): string {
    if (level >= 50) return 'Oracle';
    if (level >= 10) return 'Poll Master';
    return 'Newbie';
  }

  /**
   * Award points with duplicate prevention and ledger tracking
   */
  async awardPoints(
    userId: number,
    points: number,
    actionType: ActionType,
    targetId?: number,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; pointsEarned?: number; message?: string }> {
    // Daily Limit Check for CREATE_POLL (max 3/day)
    if (actionType === 'CREATE_POLL') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const count = await this.pointTransactionRepository.count({
        where: {
          userId,
          actionType: 'CREATE_POLL',
          createdAt: MoreThan(startOfDay),
        },
      });

      if (count >= 3) {
        return {
          success: false,
          pointsEarned: 0,
          message: 'Daily limit reached for poll creation points',
        };
      }
    }

    // Duplicate Prevention for FOLLOW (same user can't earn points for following same person twice)
    if (actionType === 'FOLLOW' && targetId) {
      const existing = await this.pointTransactionRepository.findOne({
        where: { userId, actionType: 'FOLLOW', targetId },
      });
      if (existing) {
        return {
          success: false,
          pointsEarned: 0,
          message: 'Already earned points for following this user',
        };
      }
    }

    // Duplicate Prevention for LIKE_COMMENT (same user can't earn points for liking same comment twice)
    if (actionType === 'LIKE_COMMENT' && targetId) {
      const existing = await this.pointTransactionRepository.findOne({
        where: { userId, actionType: 'LIKE_COMMENT', targetId },
      });
      if (existing) {
        return {
          success: false,
          pointsEarned: 0,
          message: 'Already earned points for liking this comment',
        };
      }
    }

    // Duplicate Prevention for TRENDING_BONUS (same poll can only give trending bonus once)
    if (actionType === 'TRENDING_BONUS' && targetId) {
      const existing = await this.pointTransactionRepository.findOne({
        where: { userId, actionType: 'TRENDING_BONUS', targetId },
      });
      if (existing) {
        return {
          success: false,
          pointsEarned: 0,
          message: 'Already awarded trending bonus for this poll',
        };
      }
    }

    // Record Transaction in Ledger
    const tx = this.pointTransactionRepository.create({
      userId,
      points,
      actionType,
      targetId,
      metadata,
      reason: actionType.toLowerCase(), // Legacy compatibility
    });
    await this.pointTransactionRepository.save(tx);

    // Update User Points
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
      user.points = (user.points || 0) + points;
      await this.userRepository.save(user);
      return {
        success: true,
        pointsEarned: points,
        message: `+${points} Points`,
      };
    }

    return { success: false, pointsEarned: 0 };
  }

  /**
   * Get user's transaction ledger for Points History page
   */
  async getUserLedger(userId: number, limit = 50): Promise<PointTransaction[]> {
    return this.pointTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 50) {
    return this.userRepository.find({
      order: { points: 'DESC' },
      take: limit,
      select: ['id', 'username', 'avatar', 'points'],
    });
  }

  /**
   * Get user rank with level info
   */
  async getUserRank(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return null;

    // Calculate rank position
    const higherRanked = await this.userRepository.count({
      where: { points: MoreThan(user.points || 0) },
    });

    const level = this.getLevel(user.points || 0);
    return {
      rank: higherRanked + 1,
      points: user.points || 0,
      level,
      title: this.getTitle(level),
    };
  }
  /**
   * Get top N users for moderator assignments
   */
  async getTopModerators(limit: number): Promise<User[]> {
    return this.userRepository.find({
      order: { points: 'DESC', id: 'ASC' },
      take: limit,
      select: ['id', 'username', 'points'],
    });
  }
}
