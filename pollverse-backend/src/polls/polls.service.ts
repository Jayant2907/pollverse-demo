import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Poll } from './entities/poll.entity';
import { Comment } from './entities/comment.entity';
import { Vote } from './entities/vote.entity';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) { }

  async create(createPollDto: CreatePollDto) {
    const poll = this.pollsRepository.create({
      ...createPollDto,
      votes: {},
      createdAt: new Date(),
    });
    return this.pollsRepository.save(poll);
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

  async findAll(query: { category?: string; search?: string; tag?: string }) {
    const qb = this.pollsRepository.createQueryBuilder('poll');
    qb.leftJoinAndSelect('poll.creator', 'creator');
    qb.loadRelationCountAndMap('poll.commentsCount', 'poll.comments');

    if (query.category && query.category !== 'For You' && query.category !== 'Following' && query.category !== 'Trending') {
      qb.andWhere('poll.category = :category', { category: query.category });
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

    return qb.getMany();
  }

  findOne(id: number) {
    return this.pollsRepository.findOne({
      where: { id },
      relations: ['creator', 'comments', 'comments.user']
    });
  }

  update(id: number, updatePollDto: UpdatePollDto) {
    return this.pollsRepository.update(id, updatePollDto);
  }

  remove(id: number) {
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

    return { success: true, message: 'Vote recorded', votes: poll.votes };
  }

  async getUserVote(pollId: number, userId: number) {
    return this.voteRepository.findOneBy({ pollId, userId });
  }

  // ============ LIKES/DISLIKES ============
  async likePoll(pollId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (poll) {
      poll.likes = (poll.likes || 0) + 1;
      await this.pollsRepository.save(poll);
      return { success: true, likes: poll.likes };
    }
    return { success: false };
  }

  async dislikePoll(pollId: number) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (poll) {
      poll.dislikes = (poll.dislikes || 0) + 1;
      await this.pollsRepository.save(poll);
      return { success: true, dislikes: poll.dislikes };
    }
    return { success: false };
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
    return this.commentRepository.save(comment);
  }

  async likeComment(commentId: number) {
    const comment = await this.commentRepository.findOneBy({ id: commentId });
    if (comment) {
      comment.likes = (comment.likes || 0) + 1;
      await this.commentRepository.save(comment);
      return { success: true, likes: comment.likes };
    }
    return { success: false };
  }

  // ============ SEED COMMENTS ============
  async seedComments(commentsData: { pollId: number; userId: number; text: string }[]) {
    const comments = commentsData.map(dto => this.commentRepository.create(dto));
    return this.commentRepository.save(comments);
  }
}
