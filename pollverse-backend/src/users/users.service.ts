import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Interaction } from './entities/interaction.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PointsService } from '../points/points.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Interaction)
    private interactionRepository: Repository<Interaction>,
    private readonly pointsService: PointsService,
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
    const targetUser = await this.usersRepository.findOneBy({ id: targetUserId });
    let pointsEarned = 0;

    if (user && targetUser) {
      // Update following for current user
      const following = user.following || [];
      if (!following.includes(String(targetUserId))) {
        following.push(String(targetUserId));
        user.following = following;
        await this.usersRepository.save(user);

        // Award points for following
        const result = await this.pointsService.awardPoints(userId, 10, 'FOLLOW', targetUserId, { targetUserId });
        if (result.success) {
          pointsEarned = result.pointsEarned || 0;
        }
      }

      // Update followers for target user
      const followers = targetUser.followers || [];
      if (!followers.includes(String(userId))) {
        followers.push(String(userId));
        targetUser.followers = followers;
        await this.usersRepository.save(targetUser);
      }
    }
    return { ...user, pointsEarned };
  }

  async unfollow(userId: number, targetUserId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    const targetUser = await this.usersRepository.findOneBy({ id: targetUserId });

    if (user) {
      user.following = (user.following || []).filter(id => id !== String(targetUserId));
      await this.usersRepository.save(user);
    }

    if (targetUser) {
      targetUser.followers = (targetUser.followers || []).filter(id => id !== String(userId));
      await this.usersRepository.save(targetUser);
    }
    return user;
  }

  async getFollowers(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user || !user.followers || user.followers.length === 0) return [];

    // Convert string IDs to numbers
    const followerIds = user.followers.map(fid => parseInt(fid)).filter(fid => !isNaN(fid));
    if (followerIds.length === 0) return [];

    return this.usersRepository.createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: followerIds })
      .getMany();
  }

  async getFollowing(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user || !user.following || user.following.length === 0) return [];

    // Convert string IDs to numbers
    const followingIds = user.following.map(fid => parseInt(fid)).filter(fid => !isNaN(fid));
    if (followingIds.length === 0) return [];

    return this.usersRepository.createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: followingIds })
      .getMany();
  }
}
