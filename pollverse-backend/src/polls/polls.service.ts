import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Poll } from './entities/poll.entity';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Vote } from './entities/vote.entity';
import { Interaction } from '../users/entities/interaction.entity';
import { ModerationLog } from './entities/moderation-log.entity';

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
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,

    private readonly notificationsService: NotificationsService,
    private readonly pointsService: PointsService,
  ) { }

  async create(createPollDto: CreatePollDto) {
    const status = createPollDto.status || 'PENDING';
    const poll = this.pollsRepository.create({
      ...createPollDto,
      votes: {},
      status: status,
      createdAt: new Date(),
    });

    if (status !== 'DRAFT') {
      // Check if user qualifies for moderation bypass (e.g. > 2000 points)
      if (createPollDto.creatorId) {
        const userRank = await this.pointsService.getUserRank(createPollDto.creatorId);
        if (userRank && (userRank.points >= 2000 || userRank.rank <= 10)) {
          poll.status = poll.scheduledAt ? 'SCHEDULED' : 'PUBLISHED';
        }
      }
    }

    const savedPoll = await this.pollsRepository.save(poll);

    // Update user's pollsCount if it's not a draft
    if (savedPoll.creatorId && savedPoll.status !== 'DRAFT') {
      await this.pollsRepository.manager.getRepository('User').increment({ id: savedPoll.creatorId }, 'pollsCount', 1);
      // Award Points for Creation
      await this.pointsService.awardPoints(savedPoll.creatorId, 50, 'CREATE_POLL', savedPoll.id, { pollId: savedPoll.id });
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
    } else if (query.category && !['For You', 'Following', 'Trending', 'Pending', 'Drafts'].includes(query.category)) {
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

    // Status Filtering
    if (query.category === 'Pending') {
      qb.andWhere('poll.status = :status', { status: 'PENDING' });
    } else if (query.category === 'Drafts' && query.creatorId && query.userId && Number(query.userId) === Number(query.creatorId)) {
      qb.andWhere('poll.status = :status', { status: 'DRAFT' });
    } else if (query.creatorId) {
      if (query.userId && Number(query.userId) === Number(query.creatorId)) {
        // Creator viewing their own profile - show all except potentially others' drafts
      } else {
        // Viewing someone else's profile - show only published
        qb.andWhere('poll.status = :status', { status: 'PUBLISHED' });
      }
    } else {
      // General feed
      qb.andWhere('poll.status = :status', { status: 'PUBLISHED' });
    }

    // Scheduling Filter: Only show polls where scheduledAt is null or in the past
    // But allow creator to see their own scheduled polls
    if (query.creatorId && query.userId && Number(query.userId) === Number(query.creatorId)) {
      // No time filter for own profile
    } else {
      qb.andWhere('(poll.scheduledAt IS NULL OR poll.scheduledAt <= :now)', { now: new Date() });
    }

    if (query.creatorId && query.userId && Number(query.userId) === Number(query.creatorId)) {
      qb.leftJoinAndSelect('poll.moderationLogs', 'logs');
      qb.leftJoinAndSelect('logs.moderator', 'moderator');
      qb.orderBy('logs.createdAt', 'DESC');
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



  async update(id: number, updatePollDto: UpdatePollDto) {
    const poll = await this.pollsRepository.findOneBy({ id });
    if (!poll) return null;

    const previousStatus = poll.status;

    // Any edit to a poll triggers re-moderation
    poll.status = 'PENDING';

    Object.assign(poll, updatePollDto);
    const savedPoll = await this.pollsRepository.save(poll);

    // If it was previously rejected or changes requested, record the resubmission in logs
    if (previousStatus !== 'PENDING') {
      const log = this.moderationLogRepository.create({
        pollId: id,
        moderatorId: updatePollDto.creatorId || poll.creatorId,
        action: 'RESUBMITTED',
        comment: 'User resubmitted the poll after edits.'
      });
      await this.moderationLogRepository.save(log);
    }

    return savedPoll;
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
    let actionType: 'VOTE' | 'SWIPE_BONUS' | 'SURVEY_COMPLETE' | 'SIGN_PETITION' = 'VOTE';
    if (poll.pollType === 'swipe') { points = 10; actionType = 'SWIPE_BONUS'; }
    if (poll.pollType === 'survey') { points = 20; actionType = 'SURVEY_COMPLETE'; }
    if (poll.pollType === 'petition') { points = 15; actionType = 'SIGN_PETITION'; }
    const ptResult = await this.pointsService.awardPoints(userId, points, actionType, pollId, { pollId });

    return { success: true, message: 'Vote recorded', votes: poll.votes, pointsEarned: ptResult.pointsEarned || 0 };
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
        await this.pointsService.awardPoints(poll.creatorId, 500, 'TRENDING_BONUS', poll.id, { pollId: poll.id });
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
  async getComments(pollId: number, userId?: number) {
    const comments = await this.commentRepository.find({
      where: { pollId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    if (userId) {
      const likedCommentIds = (await this.commentLikeRepository.find({
        where: { userId, commentId: In(comments.map(c => c.id)) }
      })).map(l => l.commentId);

      comments.forEach(c => {
        (c as any).isLiked = likedCommentIds.includes(c.id);
      });
    }

    // Threading logic: group by parentId
    const rootComments = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);

    rootComments.forEach(root => {
      root.replies = replies.filter(r => r.parentId === root.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });

    return rootComments;
  }

  async addComment(pollId: number, userId: number, text: string, parentId?: number) {
    const comment = this.commentRepository.create({ pollId, userId, text, parentId });
    const saved = await this.commentRepository.save(comment);

    if (parentId) {
      await this.commentRepository.increment({ id: parentId }, 'replyCount', 1);

      // Notify parent comment author
      const parentComment = await this.commentRepository.findOneBy({ id: parentId });
      if (parentComment && parentComment.userId !== userId) {
        this.notificationsService.create({
          recipientId: parentComment.userId,
          actorId: userId,
          type: 'comment_reply',
          resourceId: pollId,
          resourceType: 'poll'
        }).catch(e => console.error(e));
      }
    }

    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (poll && poll.creatorId && poll.creatorId !== userId && !parentId) {
      this.notificationsService.create({ recipientId: poll.creatorId, actorId: userId, type: 'comment', resourceId: pollId, resourceType: 'poll' }).catch(e => console.error(e));
    }
    return saved;
  }

  async likeComment(commentId: number, userId: number) {
    const existingLike = await this.commentLikeRepository.findOneBy({ commentId, userId });
    if (existingLike) return { success: true };

    const comment = await this.commentRepository.findOneBy({ id: commentId });
    if (comment) {
      await this.commentLikeRepository.save(this.commentLikeRepository.create({ commentId, userId }));
      comment.likes = (comment.likes || 0) + 1;
      await this.commentRepository.save(comment);
      // Award points for comment like
      if (comment.userId) {
        await this.pointsService.awardPoints(comment.userId, 2, 'LIKE_COMMENT', commentId, { commentId, pollId: comment.pollId });
      }

      // Notify comment author
      if (comment.userId !== userId) {
        this.notificationsService.create({
          recipientId: comment.userId,
          actorId: userId,
          type: 'comment_like',
          resourceId: comment.pollId,
          resourceType: 'poll'
        }).catch(e => console.error(e));
      }

      return { success: true, likes: comment.likes };
    }
    return { success: false };
  }

  async unlikeComment(commentId: number, userId: number) {
    const existingLike = await this.commentLikeRepository.findOneBy({ commentId, userId });
    if (!existingLike) return { success: true };

    const comment = await this.commentRepository.findOneBy({ id: commentId });
    if (comment) {
      await this.commentLikeRepository.remove(existingLike);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
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

  async getInteractors(pollId: number, type: 'like' | 'dislike' | 'vote') {
    if (type === 'vote') {
      const votes = await this.voteRepository.find({
        where: { pollId },
        relations: ['user'],
      });
      // Filter out duplicate users if any (though Unique constraint prevents it)
      return votes.map(v => v.user);
    }
    const interactions = await this.interactionRepository.find({
      where: { pollId, type },
      relations: ['user'],
    });
    return interactions.map(i => i.user);
  }

  // ============ MODERATION ============
  async moderatorAction(pollId: number, moderatorId: number, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', comment?: string) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false, message: 'Poll not found' };

    // Limit to Top 4 users
    const rankInfo = await this.pointsService.getUserRank(moderatorId);
    if (!rankInfo || rankInfo.rank > 4) {
      return { success: false, message: 'Only Top 4 users on the leaderboard can moderate content.' };
    }

    // Prevent duplicate actions
    const existing = await this.moderationLogRepository.findOne({
      where: { pollId, moderatorId, action }
    });
    if (existing) {
      return { success: false, message: `You have already ${action.toLowerCase().replace('_', ' ')}d this poll.` };
    }

    const log = this.moderationLogRepository.create({
      pollId,
      moderatorId,
      action,
      comment
    });
    await this.moderationLogRepository.save(log);

    if (action === 'REJECT') {
      poll.status = 'REJECTED';
      await this.pollsRepository.save(poll);
    } else if (action === 'REQUEST_CHANGES') {
      poll.status = 'CHANGES_REQUESTED';
      await this.pollsRepository.save(poll);
    } else if (action === 'APPROVE') {
      // Check distinct approvals
      const result = await this.moderationLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.moderatorId)', 'count')
        .where('log.pollId = :pollId', { pollId })
        .andWhere('log.action = :action', { action: 'APPROVE' })
        .getRawOne();

      const approvalCount = parseInt(result.count || '0');
      if (approvalCount >= 2) {
        poll.status = 'PUBLISHED';
        await this.pollsRepository.save(poll);
        // Award creator points
        if (poll.creatorId) {
          await this.pointsService.awardPoints(poll.creatorId, 100, 'POLL_PUBLISHED', poll.id, { pollId: poll.id });
        }
      }
    }

    return { success: true, status: poll.status };
  }

  async getModerationHistory(pollId: number) {
    return this.moderationLogRepository.find({
      where: { pollId },
      relations: ['moderator'],
      order: { createdAt: 'DESC' }
    });
  }
}
