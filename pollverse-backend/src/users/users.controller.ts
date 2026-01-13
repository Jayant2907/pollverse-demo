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

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(+id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(+id);
  }

  // ============ SIMPLE LOGIN (No Auth for now) ============
  @Post('login')
  async login(@Body() body: { email: string; phoneNumber?: string; password?: string }) {
    let user = await this.usersService.findByEmail(body.email);
    if (user) {
      // If user exists, but doesn't have a phone number and one was provided, update it
      if (!user.phoneNumber && body.phoneNumber) {
        await this.usersService.update(user.id, { phoneNumber: body.phoneNumber });
        user = await this.usersService.findOne(user.id);
      }
      return { success: true, user: { ...user, password: undefined } };
    }

    // If not found, creating a new user (Signup flow)
    const newUser = await this.usersService.create({
      email: body.email,
      username: body.email.split('@')[0],
      avatar: `https://i.pravatar.cc/150?u=${body.email}`,
      phoneNumber: body.phoneNumber,
    } as any);

    return { success: true, user: { ...newUser, password: undefined } };
  }
}
