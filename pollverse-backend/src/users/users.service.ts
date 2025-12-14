import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Interaction } from './entities/interaction.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Interaction)
    private interactionRepository: Repository<Interaction>,
  ) { }

  async seed(usersData: any[]) {
    if (!Array.isArray(usersData)) return [];
    const savedUsers: any[] = [];
    for (const data of usersData) {
      // Check if user with this email already exists
      if (data.email) {
        const existing = await this.usersRepository.findOneBy({ email: data.email });
        if (existing) {
          savedUsers.push(existing);
          continue;
        }
      }
      const user = this.usersRepository.create(data);
      const savedUser = await this.usersRepository.save(user);
      savedUsers.push(savedUser);
    }
    return savedUsers;
  }

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }

  // ============ INTERACTIONS (Likes/Dislikes) ============
  async setInteraction(userId: number, pollId: number, type: 'like' | 'dislike' | null) {
    const existing = await this.interactionRepository.findOneBy({ userId, pollId });
    if (existing) {
      existing.type = type;
      return this.interactionRepository.save(existing);
    }
    const interaction = this.interactionRepository.create({ userId, pollId, type });
    return this.interactionRepository.save(interaction);
  }

  async getInteraction(userId: number, pollId: number) {
    return this.interactionRepository.findOneBy({ userId, pollId });
  }

  // ============ FOLLOWING ============
  async follow(userId: number, targetUserId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (user) {
      const following = user.following || [];
      if (!following.includes(String(targetUserId))) {
        following.push(String(targetUserId));
        user.following = following;
        await this.usersRepository.save(user);
      }
    }
    return user;
  }

  async unfollow(userId: number, targetUserId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (user) {
      user.following = (user.following || []).filter(id => id !== String(targetUserId));
      await this.usersRepository.save(user);
    }
    return user;
  }
}
