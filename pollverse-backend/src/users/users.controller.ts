import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('seed')
  seed(@Body() seedData: any[]) {
    return this.usersService.seed(seedData);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  // ============ INTERACTIONS ============
  @Post(':id/interaction/:pollId')
  setInteraction(
    @Param('id') id: string,
    @Param('pollId') pollId: string,
    @Body() body: { type: 'like' | 'dislike' | null }
  ) {
    return this.usersService.setInteraction(+id, +pollId, body.type);
  }

  @Get(':id/interaction/:pollId')
  getInteraction(@Param('id') id: string, @Param('pollId') pollId: string) {
    return this.usersService.getInteraction(+id, +pollId);
  }

  // ============ FOLLOWING ============
  @Post(':id/follow/:targetId')
  follow(@Param('id') id: string, @Param('targetId') targetId: string) {
    return this.usersService.follow(+id, +targetId);
  }

  @Post(':id/unfollow/:targetId')
  unfollow(@Param('id') id: string, @Param('targetId') targetId: string) {
    return this.usersService.unfollow(+id, +targetId);
  }

  // ============ SIMPLE LOGIN (No Auth for now) ============
  @Post('login')
  async login(@Body() body: { email: string; password?: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (user) {
      // No password check for dev mode - just email based login
      return { success: true, user: { ...user, password: undefined } };
    }
    return { success: false, message: 'User not found' };
  }
}
