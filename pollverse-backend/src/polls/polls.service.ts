import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Poll } from './entities/poll.entity';
import { Comment } from './entities/comment.entity';
import { Vote } from './entities/vote.entity';
import { Interaction } from '../users/entities/interaction.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { PointsService } from '../points/points.service';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(Interaction)
    private interactionRepository: Repository<Interaction>,
    private readonly notificationsService: NotificationsService,
    private readonly pointsService: PointsService,
  ) { }

  async create(createPollDto: CreatePollDto) {
    const poll = this.pollsRepository.create({
      ...createPollDto,
      votes: {},
      createdAt: new Date(),
    });
    const savedPoll = await this.pollsRepository.save(poll);

    // Update user's pollsCount
    if (savedPoll.creatorId) {
      await this.pollsRepository.manager.getRepository('User').increment({ id: savedPoll.creatorId }, 'pollsCount', 1);
    }

    // Award Points for Creation
    if (savedPoll.creatorId) {
      await this.pointsService.awardPoints(savedPoll.creatorId, 50, 'create_poll', { pollId: savedPoll.id });
    }

    return savedPoll;
  }

  async seed(pollsData: CreatePollDto[]) {
    const polls = pollsData.map(dto => {
      const pollEntity = this.pollsRepository.create({
        ...dto,
        votes: dto['votes'] || {},
        createdAt: dto['timestamp'] || new Date(),
        likes: dto['likes'] || 0,
        dislikes: dto['dislikes'] || 0,
      });
      return pollEntity;
    });
    return this.pollsRepository.save(polls);
  }

  async findAll(query: { category?: string; search?: string; tag?: string; userId?: number; creatorId?: number }) {
    const qb = this.pollsRepository.createQueryBuilder('poll');
    qb.leftJoinAndSelect('poll.creator', 'creator');
    qb.loadRelationCountAndMap('poll.commentsCount', 'poll.comments');

    if (query.category === 'Following' && query.userId) {
      // Get the user to find who they are following
      // Note: In a real app, this might be a separate join or a more optimized query
      // For now, we'll fetch the user's following list and filter by those IDs
      const user = await this.pollsRepository.manager.getRepository('User').findOneBy({ id: query.userId }) as any;
      if (user && user.following && user.following.length > 0) {
        qb.andWhere('poll.creatorId IN (:...followingIds)', { followingIds: user.following.map((id: string) => parseInt(id)) });
      } else {
        // If not following anyone, return empty or handle accordingly. 
        // Here we return empty by adding a condition that's never true
        qb.andWhere('1 = 0');
      }
    } else if (query.category && query.category !== 'For You' && query.category !== 'Following' && query.category !== 'Trending') {
      qb.andWhere('poll.category = :category', { category: query.category });
    }

    if (query.creatorId) {
      qb.andWhere('poll.creatorId = :creatorId', { creatorId: query.creatorId });
    }

    if (query.search) {
      qb.andWhere('(LOWER(poll.question) LIKE LOWER(:search) OR LOWER(poll.description) LIKE LOWER(:search))', { search: `%${query.search}%` });
    }

    if (query.tag) {
      qb.andWhere('poll.tags LIKE :tag', { tag: `%${query.tag}%` });
    }

    if (query.category === 'Trending') {
      qb.orderBy('poll.likes', 'DESC');
    } else {
      qb.orderBy('poll.createdAt', 'DESC');
    }

    const polls = await qb.getMany();

    if (query.userId) {
      const pollIds = polls.map(p => p.id);
      if (pollIds.length > 0) {
        const interactions = await this.interactionRepository.find({
          where: {
            userId: query.userId,
            pollId: In(pollIds)
          }
        });
        const interactionMap = new Map(interactions.map(i => [i.pollId, i.type]));
        polls.forEach(p => {
          (p as any).userInteraction = interactionMap.get(p.id) || null;
        });

        // Also check if user voted on these polls
        const votes = await this.voteRepository.find({
          where: {
            userId: query.userId,
            pollId: In(pollIds)
          }
        });
        const voteMap = new Map(votes.map(v => [v.pollId, v.optionId]));
        polls.forEach(p => {
          (p as any).userVote = voteMap.get(p.id) || null;
        });
      }
    }

    return polls;
  }

  async findOne(id: number, userId?: number) {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (poll && userId) {
      const interaction = await this.interactionRepository.findOneBy({ pollId: id, userId });
      (poll as any).userInteraction = interaction ? interaction.type : null;

      const vote = await this.voteRepository.findOneBy({ pollId: id, userId });
      (poll as any).userVote = vote ? vote.optionId : null;
    }

    if (poll) {
      poll.commentsCount = await this.commentRepository.countBy({ pollId: id });
    }

    return poll;
  }



  update(id: number, updatePollDto: UpdatePollDto) {
    return this.pollsRepository.update(id, updatePollDto);
  }

  async remove(id: number) {
    const poll = await this.pollsRepository.findOneBy({ id });
    if (poll && poll.creatorId) {
      await this.pollsRepository.manager.getRepository('User').decrement({ id: poll.creatorId }, 'pollsCount', 1);
    }
    return this.pollsRepository.delete(id);
  }

  // ============ VOTING ============
  async vote(pollId: number, userId: number, optionId: string) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) {
      return { success: false, message: 'Poll not found' };
    }

    // Check Expiration
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return { success: false, message: 'Poll has expired' };
    }

    // Check Max Votes
    if (poll.maxVotes) {
      const totalVotes = Object.values(poll.votes || {}).reduce((a: number, b: number) => a + b, 0);
      if (totalVotes >= poll.maxVotes) {
        return { success: false, message: 'Maximum votes reached' };
      }
    }

    // Check if user already voted
    const existingVote = await this.voteRepository.findOneBy({ pollId, userId });
    if (existingVote) {
      return { success: false, message: 'User already voted on this poll' };
    }

    // Create vote record
    const vote = this.voteRepository.create({ pollId, userId, optionId });
    await this.voteRepository.save(vote);

    // Update poll votes count
    const votes = poll.votes || {};
    votes[optionId] = (votes[optionId] || 0) + 1;
    poll.votes = votes;
    await this.pollsRepository.save(poll);

    if (poll.creatorId && poll.creatorId !== userId) {
      try {
        await this.notificationsService.create({
          recipientId: poll.creatorId,
          actorId: userId,
          type: 'vote',
          resourceId: pollId,
          resourceType: 'poll'
        });
      } catch (e) { console.error("Notification failed", e); }
    }

    // Award Points for Voting
    let points = 5;
    if (poll.pollType === 'swipe') points = 10;
    if (poll.pollType === 'survey') points = 20;
    const ptResult = await this.pointsService.awardPoints(userId, points, 'vote', { pollId });

    return { success: true, message: 'Vote recorded', votes: poll.votes, pointsEarned: ptResult.success ? points : 0 };
  }

  async getUserVote(pollId: number, userId: number) {
    return this.voteRepository.findOneBy({ pollId, userId });
  }

  async unvote(pollId: number, userId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false };

    const vote = await this.voteRepository.findOneBy({ pollId, userId });
    if (vote) {
      const optionId = vote.optionId;
      const votes = poll.votes || {};
      if (votes[optionId] > 0) {
        votes[optionId]--;
      }
      poll.votes = votes;
      await this.voteRepository.remove(vote);
      await this.pollsRepository.save(poll);
      return { success: true, votes: poll.votes };
    }
    return { success: false, message: 'Vote not found' };
  }

  // ============ LIKES/DISLIKES ============
  async likePoll(pollId: number, userId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false, message: 'Poll not found' };

    let interaction = await this.interactionRepository.findOneBy({ pollId, userId });

    if (interaction) {
      if (interaction.type === 'like') {
        return { success: true, likes: poll.likes, dislikes: poll.dislikes };
      } else if (interaction.type === 'dislike') {
        interaction.type = 'like';
        await this.interactionRepository.save(interaction);
        poll.dislikes = Math.max(0, (poll.dislikes || 0) - 1);
        poll.likes = (poll.likes || 0) + 1;
        await this.pollsRepository.save(poll);
      }
    } else {
      interaction = this.interactionRepository.create({ pollId, userId, type: 'like' });
      await this.interactionRepository.save(interaction);
      poll.likes = (poll.likes || 0) + 1;
      // Check for Trending Status (50 Likes)
      if ((poll.likes || 0) + 1 === 50 && poll.creatorId) {
        await this.pointsService.awardPoints(poll.creatorId, 500, 'trending_bonus', { pollId: poll.id });
        // Notify user about trending status?
      }

      await this.pollsRepository.save(poll);

      if (poll.creatorId && poll.creatorId !== userId) {
        this.notificationsService.create({ recipientId: poll.creatorId, actorId: userId, type: 'like', resourceId: pollId, resourceType: 'poll' }).catch(e => console.error(e));
      }
    }
    return { success: true, likes: poll.likes, dislikes: poll.dislikes };
  }

  async dislikePoll(pollId: number, userId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false, message: 'Poll not found' };

    let interaction = await this.interactionRepository.findOneBy({ pollId, userId });

    if (interaction) {
      if (interaction.type === 'dislike') {
        return { success: true, likes: poll.likes, dislikes: poll.dislikes };
      } else if (interaction.type === 'like') {
        interaction.type = 'dislike';
        await this.interactionRepository.save(interaction);
        poll.likes = Math.max(0, (poll.likes || 0) - 1);
        poll.dislikes = (poll.dislikes || 0) + 1;
        await this.pollsRepository.save(poll);
      }
    } else {
      interaction = this.interactionRepository.create({ pollId, userId, type: 'dislike' });
      await this.interactionRepository.save(interaction);
      poll.dislikes = (poll.dislikes || 0) + 1;
      await this.pollsRepository.save(poll);

      // Notify for dislike if desired
      if (poll.creatorId && poll.creatorId !== userId) {
        this.notificationsService.create({ recipientId: poll.creatorId, actorId: userId, type: 'dislike', resourceId: pollId, resourceType: 'poll' }).catch(e => console.error(e));
      }
    }
    return { success: true, likes: poll.likes, dislikes: poll.dislikes };
  }

  async unlikePoll(pollId: number, userId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false };

    const interaction = await this.interactionRepository.findOneBy({ pollId, userId });
    if (interaction) {
      if (interaction.type === 'like') poll.likes = Math.max(0, (poll.likes || 0) - 1);
      if (interaction.type === 'dislike') poll.dislikes = Math.max(0, (poll.dislikes || 0) - 1);

      await this.interactionRepository.remove(interaction);
      await this.pollsRepository.save(poll);
    }
    return { success: true, likes: poll.likes, dislikes: poll.dislikes };
  }

  // ============ COMMENTS ============
  async getComments(pollId: number) {
    return this.commentRepository.find({
      where: { pollId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async addComment(pollId: number, userId: number, text: string) {
    const comment = this.commentRepository.create({ pollId, userId, text });
    const saved = await this.commentRepository.save(comment);

    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (poll && poll.creatorId && poll.creatorId !== userId) {
      this.notificationsService.create({ recipientId: poll.creatorId, actorId: userId, type: 'comment', resourceId: pollId, resourceType: 'poll' }).catch(e => console.error(e));
    }
    return saved;
  }

  async likeComment(commentId: number) {
    const comment = await this.commentRepository.findOneBy({ id: commentId });
    if (comment) {
      comment.likes = (comment.likes || 0) + 1;
      await this.commentRepository.save(comment);
      // Award points for comment like
      if (comment.userId) {
        await this.pointsService.awardPoints(comment.userId, 2, 'comment_like', { commentId, pollId: comment.pollId });
      }
      return { success: true, likes: comment.likes };
    }
    return { success: false };
  }

  // ============ SEED COMMENTS ============
  async seedComments(commentsData: { pollId: number; userId: number; text: string }[]) {
    const comments = commentsData.map(dto => this.commentRepository.create(dto));
    return this.commentRepository.save(comments);
  }

  async getInteractors(pollId: number, type: 'like' | 'dislike') {
    const interactions = await this.interactionRepository.find({
      where: { pollId, type },
      relations: ['user'],
    });
    return interactions.map(i => i.user);
  }
}
