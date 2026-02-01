import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { SystemConfig } from './entities/system-config.entity';
import { ModerationLog } from './entities/moderation-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
import { PollsService } from './polls.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
    private notificationsService: NotificationsService,
    private pointsService: PointsService,
    private pollsService: PollsService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPolls() {
    this.logger.debug('Checking for scheduled polls to publish...');

    const now = new Date();
    const scheduledPolls = await this.pollsRepository.find({
      where: {
        status: 'PUBLISHED', // They are already "published" in terms of status but filtered by date
        scheduledAt: LessThanOrEqual(now),
      },
    });

    // Actually, based on my plan, I might want a 'SCHEDULED' status to make it cleaner
    // and transition it to 'PUBLISHED' when time hits.

    const pollsToPublish = await this.pollsRepository.find({
      where: {
        status: 'SCHEDULED',
        scheduledAt: LessThanOrEqual(now),
      },
    });

    if (pollsToPublish.length > 0) {
      this.logger.log(`Publishing ${pollsToPublish.length} scheduled polls.`);

      for (const poll of pollsToPublish) {
        poll.status = 'PUBLISHED';
        await this.pollsRepository.save(poll);

        // Notify followers? This would require a notification service update
        // this.notificationsService.notifyFollowers(poll.creatorId, 'New poll published!');
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleModerationSLA() {
    this.logger.debug('Checking for moderation SLA breaches...');
    const now = new Date();

    // Find polls that breached deadline and are not yet escalated
    const overduePolls = await this.pollsRepository.find({
      where: {
        status: 'PENDING',
        isEscalated: false,
        moderationDeadline: LessThanOrEqual(now),
      },
    });

    if (overduePolls.length > 0) {
      this.logger.log(`Escalating ${overduePolls.length} polls due to SLA breach.`);

      const config = await this.systemConfigRepository.findOne({ where: { id: 1 } }) || { penaltyPointsPerMiss: 50, reviewTimeLimitHours: 24 } as SystemConfig;

      for (const poll of overduePolls) {
        // Penalty logic
        if (poll.assignedModeratorId) {
          await this.pointsService.awardPoints(
            poll.assignedModeratorId,
            -(config?.penaltyPointsPerMiss || 50),
            'MODERATION_PENALTY',
            poll.id,
            { reason: 'Moderation SLA breach' }
          );
        }

        // Tier Logic
        const MAX_TIER = 3;
        if (poll.currentModerationTier < MAX_TIER) {
          // Push to next tier
          poll.currentModerationTier += 1;
          // Extend deadline by another 24h (or configured limit)
          poll.moderationDeadline = new Date(Date.now() + (config?.reviewTimeLimitHours || 24) * 60 * 60 * 1000);

          // Log Push
          const log = this.moderationLogRepository.create({
            pollId: poll.id,
            moderatorId: poll.assignedModeratorId || 0,
            action: 'PUSH_NEXT_TIER', // System pushed it
            comment: `Auto-push to Tier ${poll.currentModerationTier} due to timeout.`,
          });
          await this.moderationLogRepository.save(log);

          // Re-assign to a different moderator in the pool
          await this.pollsService.assignModerator(poll, [poll.assignedModeratorId || 0]);
        } else {
          // Max tier reached, escalate to Super Admin
          poll.isEscalated = true;
          poll.moderationDeadline = null; // No deadline for Super Admin (or maybe different?)

          const log = this.moderationLogRepository.create({
            pollId: poll.id,
            moderatorId: poll.assignedModeratorId || 0,
            action: 'ESCALATED',
            comment: 'Automatic escalation to Super Admin (Max Tier Reached).',
          });
          await this.moderationLogRepository.save(log);
        }

        if (poll.isEscalated) {
          poll.assignedModeratorId = null;
        }
        await this.pollsRepository.save(poll);
      }
    }
  }
}
