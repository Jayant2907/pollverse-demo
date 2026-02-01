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
import { SystemConfig } from './entities/system-config.entity';

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
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,

    private readonly notificationsService: NotificationsService,
    private readonly pointsService: PointsService,
  ) { }

  async create(createPollDto: CreatePollDto) {
    const status = createPollDto.status || 'PENDING';

    // Fetch system config for deadline
    let config = await this.systemConfigRepository.findOne({ where: { id: 1 } });
    if (!config) {
      config = await this.systemConfigRepository.save(this.systemConfigRepository.create({ id: 1 }));
    }

    let deadline: Date | null = null;
    if (status === 'PENDING') {
      const defaultDeadline = new Date(Date.now() + config.reviewTimeLimitHours * 60 * 60 * 1000);
      if (createPollDto.scheduledAt) {
        // If scheduled time is SOONER than default deadline, use scheduled time.
        // We give them at least 1 hour just in case, or strict deadline?
        // Let's stick strictly to "Must be reviewed before launch".
        const scheduledTime = new Date(createPollDto.scheduledAt);
        deadline = scheduledTime < defaultDeadline ? scheduledTime : defaultDeadline;
      } else {
        deadline = defaultDeadline;
      }
    }

    const poll = this.pollsRepository.create({
      ...createPollDto,
      votes: {},
      status: status,
      createdAt: new Date(),
      moderationDeadline: deadline,
      isPaid: (createPollDto as any).isPaid || false,
      visibilityCategory: (createPollDto as any).visibilityCategory || 'ALL',
    });

    if (status !== 'DRAFT') {
      // Check if user qualifies for moderation bypass (e.g. > 2000 points)
      if (createPollDto.creatorId) {
        const userRank = await this.pointsService.getUserRank(
          createPollDto.creatorId,
        );
        // During testing, we want most polls to go to review. 
        // Only very high trust (10k+ points) bypasses.
        if (userRank && userRank.points >= 10000) {
          poll.status = poll.scheduledAt ? 'SCHEDULED' : 'PUBLISHED';
        }
      }
    }

    const savedPoll = await this.pollsRepository.save(poll);

    if (savedPoll.status === 'PENDING') {
      await this.assignModerator(savedPoll);
    }

    // Update user's pollsCount if it's not a draft
    if (savedPoll.creatorId && savedPoll.status !== 'DRAFT') {
      await this.pollsRepository.manager
        .getRepository('User')
        .increment({ id: savedPoll.creatorId }, 'pollsCount', 1);
      // Award Points for Creation
      await this.pointsService.awardPoints(
        savedPoll.creatorId,
        50,
        'CREATE_POLL',
        savedPoll.id,
        { pollId: savedPoll.id },
      );
    }

    return savedPoll;
  }

  async assignModerator(poll: Poll, excludeIds: number[] = []) {
    const config = await this.systemConfigRepository.findOne({
      where: { id: 1 },
    }) || { moderatorGroupSize: 3, requiredApprovals: 1 } as SystemConfig;

    // Get the top N moderators (enough to have options after exclusion)
    const topModerators = await this.pointsService.getTopModerators(
      config.moderatorGroupSize + excludeIds.length,
    );

    // Filter by group size and exclusions
    const candidates = topModerators
      .filter((m) => !excludeIds.includes(m.id))
      .slice(0, config.moderatorGroupSize);

    if (candidates.length === 0) {
      poll.assignedModeratorId = null; // Revert to pool if no specific assignment possible
      await this.pollsRepository.save(poll);
      return;
    }

    // Find the current load for each moderator in the candidates group
    const loads = await this.pollsRepository
      .createQueryBuilder('poll')
      .select('poll.assignedModeratorId', 'moderatorId')
      .addSelect('COUNT(*)', 'count')
      .where('poll.status = :status', { status: 'PENDING' })
      .andWhere('poll.assignedModeratorId IN (:...ids)', {
        ids: candidates.map((m) => m.id),
      })
      .groupBy('poll.assignedModeratorId')
      .getRawMany();

    const loadMap = new Map(
      loads.map((l) => [parseInt(l.moderatorId), parseInt(l.count)]),
    );

    // Sort candidates by current load, then by points
    candidates.sort((a, b) => {
      const loadA = loadMap.get(a.id) || 0;
      const loadB = loadMap.get(b.id) || 0;
      if (loadA !== loadB) return loadA - loadB;
      return b.points - a.points;
    });

    poll.assignedModeratorId = candidates[0].id;
    await this.pollsRepository.save(poll);
  }

  async seed(pollsData: CreatePollDto[]) {
    const polls = pollsData.map((dto) => {
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

  async findAll(query: {
    category?: string;
    search?: string;
    tag?: string;
    userId?: number;
    creatorId?: number;
  }) {
    const qb = this.pollsRepository.createQueryBuilder('poll');
    qb.leftJoinAndSelect('poll.creator', 'creator');
    qb.loadRelationCountAndMap('poll.commentsCount', 'poll.comments');

    if (query.category === 'Following' && query.userId) {
      // Get the user to find who they are following
      // Note: In a real app, this might be a separate join or a more optimized query
      // For now, we'll fetch the user's following list and filter by those IDs
      const user = (await this.pollsRepository.manager
        .getRepository('User')
        .findOneBy({ id: query.userId })) as any;
      if (user && user.following && user.following.length > 0) {
        qb.andWhere('poll.creatorId IN (:...followingIds)', {
          followingIds: user.following.map((id: string) => parseInt(id)),
        });
      } else {
        // If not following anyone, return empty or handle accordingly.
        // Here we return empty by adding a condition that's never true
        qb.andWhere('1 = 0');
      }
    } else if (
      query.category &&
      !['For You', 'Following', 'Trending', 'Pending', 'Drafts'].includes(
        query.category,
      )
    ) {
      qb.andWhere('poll.category = :category', { category: query.category });
    }

    if (query.creatorId) {
      qb.andWhere('poll.creatorId = :creatorId', {
        creatorId: query.creatorId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(poll.question) LIKE LOWER(:search) OR LOWER(poll.description) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    if (query.tag) {
      qb.andWhere('poll.tags LIKE :tag', { tag: `%${query.tag}%` });
    }

    // Status Filtering
    if (query.category === 'Pending') {
      qb.andWhere('poll.status = :status', { status: 'PENDING' });

      // If user is not Super Admin, hide escalated polls
      if (query.userId) {
        const user = await this.pollsRepository.manager.getRepository('User').findOneBy({ id: query.userId }) as any;
        if (user && user.role !== 'SUPER_ADMIN') {
          qb.andWhere('poll.isEscalated = :isEscalated', { isEscalated: false });
        }
      }
    } else if (
      query.category === 'Drafts' &&
      query.creatorId &&
      query.userId &&
      Number(query.userId) === Number(query.creatorId)
    ) {
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

      // PAID POLL VISIBILITY
      if (query.userId) {
        const user = await this.pollsRepository.manager.getRepository('User').findOneBy({ id: query.userId }) as any;
        if (user && user.role !== 'SUPER_ADMIN' && user.trustLevel < 5) {
          qb.andWhere('(poll.visibilityCategory = :vis OR poll.visibilityCategory IS NULL OR poll.visibilityCategory = \'ALL\')', { vis: 'ALL' });
        }
      } else {
        // Anonymous users only see 'ALL'
        qb.andWhere('(poll.visibilityCategory = :vis OR poll.visibilityCategory IS NULL OR poll.visibilityCategory = \'ALL\')', { vis: 'ALL' });
      }
    }

    if (query.category === 'Trending') {
      let config = await this.systemConfigRepository.findOne({ where: { id: 1 } });
      if (config) {
        // Note: PostgreSQL doesn't allow virtual columns in ORDER BY directly unless selected
        qb.addSelect(`(poll.likes * ${config.weightLikes} + poll.dislikes * -1 + 0) * (CASE WHEN poll.isPaid THEN ${config.paidPollBoostFactor} ELSE 1 END)`, 'trendingScore');
        qb.orderBy('trendingScore', 'DESC');
      } else {
        qb.orderBy('poll.likes', 'DESC');
      }
    } else {
      qb.orderBy('poll.createdAt', 'DESC');
    }

    // Scheduling Filter: Only show polls where scheduledAt is null or in the past
    // But allow creator to see their own scheduled polls
    if (
      query.creatorId &&
      query.userId &&
      Number(query.userId) === Number(query.creatorId)
    ) {
      // No time filter for own profile
    } else {
      qb.andWhere('(poll.scheduledAt IS NULL OR poll.scheduledAt <= :now)', {
        now: new Date(),
      });
    }

    if (
      query.creatorId &&
      query.userId &&
      Number(query.userId) === Number(query.creatorId)
    ) {
      qb.leftJoinAndSelect('poll.moderationLogs', 'logs');
      qb.leftJoinAndSelect('logs.moderator', 'moderator');
      qb.leftJoinAndSelect('poll.assignedModerator', 'assignedMod');
      qb.orderBy('logs.createdAt', 'DESC');
    }

    const polls = await qb.getMany();

    if (query.userId) {
      const pollIds = polls.map((p) => p.id);
      if (pollIds.length > 0) {
        const interactions = await this.interactionRepository.find({
          where: {
            userId: query.userId,
            pollId: In(pollIds),
          },
        });
        const interactionMap = new Map(
          interactions.map((i) => [i.pollId, i.type]),
        );
        polls.forEach((p) => {
          (p as any).userInteraction = interactionMap.get(p.id) || null;
        });

        // Also check if user voted on these polls
        const votes = await this.voteRepository.find({
          where: {
            userId: query.userId,
            pollId: In(pollIds),
          },
        });
        const voteMap = new Map(votes.map((v) => [v.pollId, v.optionId]));
        polls.forEach((p) => {
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
      const interaction = await this.interactionRepository.findOneBy({
        pollId: id,
        userId,
      });
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
        comment: 'User resubmitted the poll after edits.',
      });
      await this.moderationLogRepository.save(log);
    }

    return savedPoll;
  }

  async remove(id: number) {
    const poll = await this.pollsRepository.findOneBy({ id });
    if (poll && poll.creatorId) {
      await this.pollsRepository.manager
        .getRepository('User')
        .decrement({ id: poll.creatorId }, 'pollsCount', 1);
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
      const totalVotes = Object.values(poll.votes || {}).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      if (totalVotes >= poll.maxVotes) {
        return { success: false, message: 'Maximum votes reached' };
      }
    }

    // Check if user already voted
    const existingVote = await this.voteRepository.findOneBy({
      pollId,
      userId,
    });
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
          resourceType: 'poll',
        });
      } catch (e) {
        console.error('Notification failed', e);
      }
    }

    // Award Points for Voting
    let points = 5;
    let actionType:
      | 'VOTE'
      | 'SWIPE_BONUS'
      | 'SURVEY_COMPLETE'
      | 'SIGN_PETITION' = 'VOTE';
    if (poll.pollType === 'swipe') {
      points = 10;
      actionType = 'SWIPE_BONUS';
    }
    if (poll.pollType === 'survey') {
      points = 20;
      actionType = 'SURVEY_COMPLETE';
    }
    if (poll.pollType === 'petition') {
      points = 15;
      actionType = 'SIGN_PETITION';
    }
    const ptResult = await this.pointsService.awardPoints(
      userId,
      points,
      actionType,
      pollId,
      { pollId },
    );

    return {
      success: true,
      message: 'Vote recorded',
      votes: poll.votes,
      pointsEarned: ptResult.pointsEarned || 0,
    };
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
  // ============ REACTIONS ============
  async reactToPoll(pollId: number, userId: number, type: string) {
    return await this.pollsRepository.manager.transaction(async (manager) => {
      const poll = await manager.findOneBy(Poll, { id: pollId });
      if (!poll) return { success: false, message: 'Poll not found' };

      let interaction = await manager.findOne(Interaction, {
        where: { pollId, userId },
      });
      const reactions = poll.reactions || {};
      const previousType = interaction?.type;

      if (interaction) {
        if (interaction.type === type) {
          // Toggle OFF
          await manager.remove(interaction);
          if (reactions[type] > 0) reactions[type]--;

          // Backwards compatibility
          if (type === 'like' || type === '👍')
            poll.likes = Math.max(0, (poll.likes || 0) - 1);
          if (type === 'dislike' || type === '👎')
            poll.dislikes = Math.max(0, (poll.dislikes || 0) - 1);
        } else {
          // Switch Reaction
          if (previousType && reactions[previousType] > 0)
            reactions[previousType]--;
          reactions[type] = (reactions[type] || 0) + 1;
          interaction.type = type;
          await manager.save(interaction);

          // Backwards compatibility sync
          if (previousType === 'like' || previousType === '👍')
            poll.likes = Math.max(0, (poll.likes || 0) - 1);
          if (previousType === 'dislike' || previousType === '👎')
            poll.dislikes = Math.max(0, (poll.dislikes || 0) - 1);
          if (type === 'like' || type === '👍')
            poll.likes = (poll.likes || 0) + 1;
          if (type === 'dislike' || type === '👎')
            poll.dislikes = (poll.dislikes || 0) + 1;
        }
      } else {
        // New Reaction
        interaction = manager.create(Interaction, { pollId, userId, type });
        await manager.save(interaction);
        reactions[type] = (reactions[type] || 0) + 1;

        // Trending Bonus
        if (type === 'like' || type === '👍') {
          poll.likes = (poll.likes || 0) + 1;
          if (poll.likes === 50 && poll.creatorId) {
            await this.pointsService.awardPoints(
              poll.creatorId,
              500,
              'TRENDING_BONUS',
              poll.id,
              { pollId: poll.id },
            );
          }
        }
        if (type === 'dislike' || type === '👎')
          poll.dislikes = (poll.dislikes || 0) + 1;

        if (poll.creatorId && poll.creatorId !== userId) {
          this.notificationsService
            .create({
              recipientId: poll.creatorId,
              actorId: userId,
              type: 'like', // keep 'like' for notifications for now or map to reaction
              resourceId: pollId,
              resourceType: 'poll',
            })
            .catch((e) => console.error(e));
        }
      }

      poll.reactions = reactions;
      await manager.save(poll);
      return {
        success: true,
        likes: poll.likes,
        dislikes: poll.dislikes,
        reactions: poll.reactions,
        userInteraction: interaction?.type || null,
      };
    });
  }

  async likePoll(pollId: number, userId: number) {
    return this.reactToPoll(pollId, userId, 'like');
  }

  async dislikePoll(pollId: number, userId: number) {
    return this.reactToPoll(pollId, userId, 'dislike');
  }

  async unlikePoll(pollId: number, userId: number) {
    // Unlike is actually handled by toggle logic in reactToPoll if same type is passed.
    // But for legacy support, we can keep this or search existing then toggle.
    const interaction = await this.interactionRepository.findOneBy({
      pollId,
      userId,
    });
    if (interaction) {
      return this.reactToPoll(pollId, userId, interaction.type!);
    }
    return { success: true };
  }

  // ============ COMMENTS ============
  async getComments(pollId: number, userId?: number) {
    const comments = await this.commentRepository.find({
      where: { pollId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    if (userId) {
      const likedCommentIds = (
        await this.commentLikeRepository.find({
          where: { userId, commentId: In(comments.map((c) => c.id)) },
        })
      ).map((l) => l.commentId);

      comments.forEach((c) => {
        (c as any).isLiked = likedCommentIds.includes(c.id);
      });
    }

    // Threading logic: group by parentId
    const rootComments = comments.filter((c) => !c.parentId);
    const replies = comments.filter((c) => c.parentId);

    rootComments.forEach((root) => {
      root.replies = replies
        .filter((r) => r.parentId === root.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });

    return rootComments;
  }

  async addComment(
    pollId: number,
    userId: number,
    text: string,
    parentId?: number,
  ) {
    const comment = this.commentRepository.create({
      pollId,
      userId,
      text,
      parentId,
    });
    const saved = await this.commentRepository.save(comment);

    if (parentId) {
      await this.commentRepository.increment({ id: parentId }, 'replyCount', 1);

      // Notify parent comment author
      const parentComment = await this.commentRepository.findOneBy({
        id: parentId,
      });
      if (parentComment && parentComment.userId !== userId) {
        this.notificationsService
          .create({
            recipientId: parentComment.userId,
            actorId: userId,
            type: 'comment_reply',
            resourceId: pollId,
            resourceType: 'poll',
          })
          .catch((e) => console.error(e));
      }
    }

    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (poll && poll.creatorId && poll.creatorId !== userId && !parentId) {
      this.notificationsService
        .create({
          recipientId: poll.creatorId,
          actorId: userId,
          type: 'comment',
          resourceId: pollId,
          resourceType: 'poll',
        })
        .catch((e) => console.error(e));
    }
    return saved;
  }

  async reactToComment(commentId: number, userId: number, type: string) {
    return await this.commentRepository.manager.transaction(async (manager) => {
      const comment = await manager.findOneBy(Comment, { id: commentId });
      if (!comment) return { success: false, message: 'Comment not found' };

      let interaction = await manager.findOne(CommentLike, {
        where: { commentId, userId },
      });
      const reactions = comment.reactions || {};
      const previousType = interaction?.type;

      if (interaction) {
        if (interaction.type === type) {
          // Toggle OFF
          await manager.remove(interaction);
          if (reactions[type] > 0) reactions[type]--;
          if (type === 'like')
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
        } else {
          // Switch Reaction
          if (previousType && reactions[previousType] > 0)
            reactions[previousType]--;
          reactions[type] = (reactions[type] || 0) + 1;
          interaction.type = type;
          await manager.save(interaction);

          if (previousType === 'like')
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
          if (type === 'like') comment.likes = (comment.likes || 0) + 1;
        }
      } else {
        // New Reaction
        interaction = manager.create(CommentLike, { commentId, userId, type });
        await manager.save(interaction);
        reactions[type] = (reactions[type] || 0) + 1;

        if (type === 'like') {
          comment.likes = (comment.likes || 0) + 1;
        }

        // Award points for comment like/reaction
        if (comment.userId) {
          await this.pointsService.awardPoints(
            comment.userId,
            2,
            'LIKE_COMMENT',
            commentId,
            { commentId, pollId: comment.pollId },
          );
        }

        // Notify comment author
        if (comment.userId !== userId) {
          this.notificationsService
            .create({
              recipientId: comment.userId,
              actorId: userId,
              type: 'comment_like',
              resourceId: comment.pollId,
              resourceType: 'poll',
            })
            .catch((e) => console.error(e));
        }
      }

      comment.reactions = reactions;
      await manager.save(comment);
      return {
        success: true,
        likes: comment.likes,
        reactions: comment.reactions,
        userInteraction: interaction?.type || null,
      };
    });
  }

  async likeComment(commentId: number, userId: number) {
    return this.reactToComment(commentId, userId, 'like');
  }

  async unlikeComment(commentId: number, userId: number) {
    const existingLike = await this.commentLikeRepository.findOneBy({
      commentId,
      userId,
    });
    if (existingLike) {
      return this.reactToComment(commentId, userId, existingLike.type);
    }
    return { success: true };
  }

  // ============ SEED COMMENTS ============
  async seedComments(
    commentsData: { pollId: number; userId: number; text: string }[],
  ) {
    const comments = commentsData.map((dto) =>
      this.commentRepository.create(dto),
    );
    return this.commentRepository.save(comments);
  }

  async getInteractors(pollId: number, type: string) {
    if (type === 'vote') {
      const votes = await this.voteRepository.find({
        where: { pollId },
        relations: ['user'],
      });
      return votes.map((v) => v.user);
    }

    if (type === 'all') {
      const interactions = await this.interactionRepository.find({
        where: { pollId },
        relations: ['user'],
      });
      // We return interactions objects so frontend knows which user did which reaction
      return interactions.map(i => ({
        ...i.user,
        interactionType: i.type
      }));
    }

    const interactions = await this.interactionRepository.find({
      where: { pollId, type },
      relations: ['user'],
    });
    return interactions.map((i) => ({
      ...i.user,
      interactionType: i.type
    }));
  }

  async moderatorAction(
    pollId: number,
    moderatorId: number,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PUSH_NEXT_TIER',
    comment?: string,
  ) {
    const poll = await this.pollsRepository.findOneBy({ id: pollId });
    if (!poll) return { success: false, message: 'Poll not found' };

    const moderator = await this.pollsRepository.manager.getRepository('User').findOneBy({ id: moderatorId }) as any;
    if (!moderator) return { success: false, message: 'User not found' };

    const isSuperAdmin = moderator.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      // Logic for regular moderators
      const rankInfo = await this.pointsService.getUserRank(moderatorId);

      // Tiered logic: Tier 1 is Rank 1-4, Tier 2 is Rank 5-10, etc.
      // Or just check if poll.currentModerationTier matches moderator's capability
      // For now, let's stick to the user's "cascading" idea.
      // If poll is in Tier 1, only Rank 1-4 can touch it.
      // If poll is pushed to Tier 2, maybe Rank 5-10 can touch it?

      const allowedRankMax = poll.currentModerationTier === 1 ? 4 : 10;

      if (!rankInfo || rankInfo.rank > allowedRankMax) {
        return {
          success: false,
          message: `Only users with sufficient rank can moderate this poll (Tier ${poll.currentModerationTier}).`,
        };
      }

      // Check if poll is escalated (Super Admin only)
      if (poll.isEscalated) {
        return {
          success: false,
          message: 'This poll has been escalated to Super Admin.',
        };
      }
    }

    // Prevent duplicate actions
    const existing = await this.moderationLogRepository.findOne({
      where: { pollId, moderatorId, action: action as any },
    });
    if (existing && action !== 'PUSH_NEXT_TIER') {
      return {
        success: false,
        message: `You have already ${action.toLowerCase().replace('_', ' ')}d this poll.`,
      };
    }

    const log = this.moderationLogRepository.create({
      pollId,
      moderatorId,
      action: action as any,
      comment,
    });
    await this.moderationLogRepository.save(log);

    if (action === 'REJECT') {
      poll.status = 'REJECTED';
      poll.moderationDeadline = null;
      await this.pollsRepository.save(poll);
    } else if (action === 'REQUEST_CHANGES') {
      poll.status = 'CHANGES_REQUESTED';
      poll.moderationDeadline = null;
      await this.pollsRepository.save(poll);
    } else if (action === 'PUSH_NEXT_TIER') {
      poll.currentModerationTier += 1;
      // Refresh deadline for new tier?
      let config = await this.systemConfigRepository.findOne({ where: { id: 1 } });
      if (config) {
        poll.moderationDeadline = new Date(Date.now() + config.reviewTimeLimitHours * 60 * 60 * 1000);
      }
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
      // If Super Admin approves, it's instant?
      const config = await this.systemConfigRepository.findOne({
        where: { id: 1 },
      });
      const threshold = config?.requiredApprovals ?? 1;

      if (approvalCount >= threshold || isSuperAdmin) {
        poll.status = 'PUBLISHED';
        poll.moderationDeadline = null;
        poll.isEscalated = false;
        await this.pollsRepository.save(poll);
        // Award creator points
        if (poll.creatorId) {
          await this.pointsService.awardPoints(
            poll.creatorId,
            100,
            'POLL_PUBLISHED',
            poll.id,
            { pollId: poll.id },
          );
        }
      }
    }

    return { success: true, status: poll.status, currentTier: poll.currentModerationTier };
  }

  async getModerationHistory(pollId: number) {
    return this.moderationLogRepository.find({
      where: { pollId },
      relations: ['moderator'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============ SYSTEM CONFIG ============
  async getSystemConfig() {
    let config = await this.systemConfigRepository.findOne({ where: { id: 1 } });
    if (!config) {
      config = await this.systemConfigRepository.save(this.systemConfigRepository.create({ id: 1 }));
    }

    // Ensure defaults if missing (handle existing empty row)
    let needsSave = false;
    if (config.weightVotes == null) { config.weightVotes = 1.0; needsSave = true; }
    if (config.weightLikes == null) { config.weightLikes = 2.0; needsSave = true; }
    if (config.weightComments == null) { config.weightComments = 1.5; needsSave = true; }
    if (config.paidPollBoostFactor == null) { config.paidPollBoostFactor = 2.0; needsSave = true; }
    if (config.penaltyPointsPerMiss == null) { config.penaltyPointsPerMiss = 50; needsSave = true; }
    if (config.reviewTimeLimitHours == null) { config.reviewTimeLimitHours = 24; needsSave = true; }

    if (needsSave) {
      config = await this.systemConfigRepository.save(config);
    }

    return config;
  }

  async updateSystemConfig(update: any) {
    let config = await this.getSystemConfig();
    Object.assign(config, update);
    return this.systemConfigRepository.save(config);
  }
}
