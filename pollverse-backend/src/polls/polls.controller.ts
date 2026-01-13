import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) { }

  @Post()
  create(@Body() createPollDto: CreatePollDto) {
    return this.pollsService.create(createPollDto);
  }

  @Post('seed')
  seed(@Body() seedData: CreatePollDto[]) {
    return this.pollsService.seed(seedData);
  }

  @Get()
  findAll(
    @Query()
    query: {
      category?: string;
      search?: string;
      tag?: string;
      userId?: string;
      creatorId?: string;
    },
  ) {
    const parseSafeInt = (val?: string) => {
      if (!val) return undefined;
      const num = parseInt(val);
      return isNaN(num) || num > 2147483647 ? undefined : num;
    };

    const backendQuery = {
      ...query,
      userId: parseSafeInt(query.userId),
      creatorId: parseSafeInt(query.creatorId),
    };
    return this.pollsService.findAll(backendQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pollsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePollDto: UpdatePollDto) {
    return this.pollsService.update(+id, updatePollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pollsService.remove(+id);
  }

  // ============ VOTING ============
  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @Body() body: { userId: number; optionId: string },
  ) {
    return this.pollsService.vote(+id, body.userId, body.optionId);
  }

  @Delete(':id/vote')
  unvote(@Param('id') id: string, @Body('userId') userId: number) {
    return this.pollsService.unvote(+id, +userId);
  }

  @Get(':id/vote/:userId')
  getUserVote(@Param('id') id: string, @Param('userId') userId: string) {
    return this.pollsService.getUserVote(+id, +userId);
  }

  // ============ LIKES/DISLIKES ============
  @Post(':id/react')
  reactToPoll(
    @Param('id') id: string,
    @Body() body: { userId: number; type: string },
  ) {
    return this.pollsService.reactToPoll(+id, body.userId, body.type);
  }

  @Get(':id/interactors')
  getInteractors(
    @Param('id') id: string,
    @Query('type') type: string,
  ) {
    return this.pollsService.getInteractors(+id, type);
  }

  // ============ COMMENTS ============
  @Get(':id/comments')
  getComments(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.pollsService.getComments(+id, userId ? +userId : undefined);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() body: { userId: number; text: string; parentId?: number },
  ) {
    return this.pollsService.addComment(
      +id,
      body.userId,
      body.text,
      body.parentId,
    );
  }

  @Post('comments/:commentId/react')
  reactToComment(
    @Param('commentId') commentId: string,
    @Body() body: { userId: number; type: string },
  ) {
    return this.pollsService.reactToComment(+commentId, body.userId, body.type);
  }

  // ============ SEED COMMENTS ============
  @Post('seed/comments')
  seedComments(
    @Body() commentsData: { pollId: number; userId: number; text: string }[],
  ) {
    return this.pollsService.seedComments(commentsData);
  }

  // ============ MODERATION ============
  @Post(':id/moderate')
  moderatorAction(
    @Param('id') id: string,
    @Body()
    body: {
      moderatorId: number;
      action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
      comment?: string;
    },
  ) {
    return this.pollsService.moderatorAction(
      +id,
      body.moderatorId,
      body.action,
      body.comment,
    );
  }

  @Get(':id/moderation-history')
  getModerationHistory(@Param('id') id: string) {
    return this.pollsService.getModerationHistory(+id);
  }
}
