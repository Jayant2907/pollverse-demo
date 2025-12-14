import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from './entities/poll.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll])],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule { }
