import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
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
        // Simple implementation: Level = 1 + floor(points / 100)
        // Or the requirements: 1=0, 10=1000, 50=10000.  Roughly: Points = 4 * Level^2 + ...
        // Let's use a simpler linear scale for MVP or a predefined map as per requirement
        if (points < 100) return 1;
        if (points < 1000) return Math.floor(points / 100) + 1; // 100->Lv2, 900->Lv10
        // After 1000, maybe slower?
        return Math.floor(Math.sqrt(points)); // 1000 -> 31, 10000 -> 100. bit off.

        // Let's stick to simple: Level = 1 + floor(points / 100)
        // Lv 1 = 0-99
        // Lv 10 = 900-999 (Requirement says Lv 10: Poll Master @ 1000 points. So 100 points per level fits)
        // Lv 50 = 4900-4999 (Requirement says Lv 50: Oracle @ 10000 points. So 200 points per level?)

        // Let's do thresholds:
        // 0 -> 1
        // 1000 -> 10
        // 10000 -> 50

        if (points < 1000) return 1 + Math.floor(points / 111); // Approx to get to 10 at 1000
        return 10 + Math.floor((points - 1000) / 225); // Approx to get to 50 at 10000
    }

    private getTitle(level: number): string {
        if (level >= 50) return 'Oracle';
        if (level >= 10) return 'Poll Master';
        return 'Newbie';
    }

    async awardPoints(userId: number, points: number, reason: PointTransaction['reason'], metadata?: Record<string, any>) {
        // Daily Limit Check for 'create_poll'
        if (reason === 'create_poll') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const count = await this.pointTransactionRepository.count({
                where: {
                    userId,
                    reason: 'create_poll',
                    createdAt: MoreThan(startOfDay)
                }
            });

            if (count >= 3) {
                return { success: false, message: 'Daily limit reached for poll creation points' };
            }
        }

        // Check for unique events (like Trending for a specific poll)
        if (reason === 'trending_bonus' && metadata?.pollId) {
            const existing = await this.pointTransactionRepository.createQueryBuilder('pt')
                .where('pt.userId = :userId', { userId })
                .andWhere('pt.reason = :reason', { reason: 'trending_bonus' })
                .andWhere('pt.metadata LIKE :meta', { meta: `%"pollId":${metadata.pollId}%` }) // Simple check for JSON string
                .getCount();

            if (existing > 0) return { success: false, message: 'Already awarded' };
        }

        // Record Transaction
        const tx = this.pointTransactionRepository.create({
            userId,
            points,
            reason,
            metadata
        });
        await this.pointTransactionRepository.save(tx);

        // Update User
        const user = await this.userRepository.findOneBy({ id: userId });
        if (user) {
            user.points = (user.points || 0) + points;
            // user.level could be stored or calculated. For performance, let's just update points.
            // If we add a level column, update it here.

            await this.userRepository.save(user);

            // TODO: In future, emit WebSocket event here
            return { success: true, newPoints: user.points, message: `+${points} Points` };
        }
        return { success: false };
    }

    async getLeaderboard(limit = 50) {
        return this.userRepository.find({
            order: { points: 'DESC' },
            take: limit,
            select: ['id', 'username', 'avatar', 'points']
        });
    }

    // Helper to get formatted user data with level
    async getUserRank(userId: number) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) return null;
        const level = this.getLevel(user.points || 0);
        return {
            points: user.points || 0,
            level,
            title: this.getTitle(level)
        };
    }
}
