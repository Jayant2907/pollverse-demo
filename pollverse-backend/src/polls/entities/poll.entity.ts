import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { Comment } from './comment.entity';
import { ModerationLog } from './moderation-log.entity';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  // Use simple JSON for complex structures to allow flexible DB swapping later.
  @Column('simple-json', { nullable: true })
  options: { id: string | number; text: string }[];

  @Column()
  creatorId: number;

  @ManyToOne(() => User, { eager: true }) // Optional eager, but good for feed
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany('Comment', 'poll')
  comments: Comment[];

  // Virtual property for count
  commentsCount?: number;

  @Column({ default: 'multiple_choice' })
  pollType: string;

  @Column({ default: 'PENDING' }) // PENDING, PUBLISHED, REJECTED, CHANGES_REQUESTED
  status: string;

  @OneToMany(() => ModerationLog, (log) => log.poll, { cascade: true })
  moderationLogs: ModerationLog[];

  @Column('simple-json', { nullable: true })
  votes: Record<string, number>;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @Column('simple-json', { nullable: true })
  reactions: Record<string, number>;

  // Swipe poll results
  @Column('simple-json', { nullable: true })
  swipeResults: { lowScoreTitle: string; highScoreTitle: string } | null;

  // Survey questions for survey type polls
  @Column('simple-json', { nullable: true })
  surveyQuestions: any[] | null;

  // Expiration settings
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxVotes: number | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  // @Column({ type: 'int', nullable: true })
  // goal_threshold: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  moderationDeadline: Date | null;

  @Column({ default: false })
  isEscalated: boolean;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ default: 'ALL' }) // ALL, PAID_ONLY, CATEGORY_SPECIFIC
  visibilityCategory: string;

  @Column({ default: 1 })
  currentModerationTier: number;

  @Column({ type: 'int', nullable: true })
  assignedModeratorId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedModeratorId' })
  assignedModerator: User;
}
