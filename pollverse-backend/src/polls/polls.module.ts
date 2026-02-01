import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from './entities/poll.entity';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Vote } from './entities/vote.entity';
import { ModerationLog } from './entities/moderation-log.entity';
import { SystemConfig } from './entities/system-config.entity';
import { SchedulingService } from './scheduling.service';

import { Interaction } from '../users/entities/interaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Poll,
      Comment,
      CommentLike,
      Vote,
      Interaction,
      ModerationLog,
      SystemConfig,
    ]),
    NotificationsModule,
    PointsModule,
  ],

  controllers: [PollsController],
  providers: [PollsService, SchedulingService],
})
export class PollsModule { }
