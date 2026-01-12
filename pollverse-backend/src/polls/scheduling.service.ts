import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulingService {
    private readonly logger = new Logger(SchedulingService.name);

    constructor(
        @InjectRepository(Poll)
        private pollsRepository: Repository<Poll>,
        private notificationsService: NotificationsService,
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
            }
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
}
