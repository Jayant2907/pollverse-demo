import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from './entities/poll.entity';
import { Comment } from './entities/comment.entity';
import { Vote } from './entities/vote.entity';

import { Interaction } from '../users/entities/interaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Comment, Vote, Interaction])],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule { }
