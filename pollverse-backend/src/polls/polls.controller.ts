import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
  findAll(@Query() query: { category?: string; search?: string; tag?: string; userId?: string }) {
    const backendQuery = {
      ...query,
      userId: query.userId ? parseInt(query.userId) : undefined
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
  vote(@Param('id') id: string, @Body() body: { userId: number; optionId: string }) {
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
  @Post(':id/like')
  likePoll(@Param('id') id: string, @Body('userId') userId: number) {
    return this.pollsService.likePoll(+id, +userId);
  }

  @Post(':id/dislike')
  dislikePoll(@Param('id') id: string, @Body('userId') userId: number) {
    return this.pollsService.dislikePoll(+id, +userId);
  }

  @Delete(':id/like')
  unlikePoll(@Param('id') id: string, @Body('userId') userId: number) {
    return this.pollsService.unlikePoll(+id, +userId);
  }

  @Delete(':id/dislike')
  undislikePoll(@Param('id') id: string, @Body('userId') userId: number) {
    return this.pollsService.unlikePoll(+id, +userId);
  }

  // ============ COMMENTS ============
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.pollsService.getComments(+id);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() body: { userId: number; text: string }) {
    return this.pollsService.addComment(+id, body.userId, body.text);
  }

  @Post('comments/:commentId/like')
  likeComment(@Param('commentId') commentId: string) {
    return this.pollsService.likeComment(+commentId);
  }

  // ============ SEED COMMENTS ============
  @Post('seed/comments')
  seedComments(@Body() commentsData: { pollId: number; userId: number; text: string }[]) {
    return this.pollsService.seedComments(commentsData);
  }
}
