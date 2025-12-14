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
  findAll(@Query() query: { category?: string; search?: string; tag?: string }) {
    return this.pollsService.findAll(query);
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
}
