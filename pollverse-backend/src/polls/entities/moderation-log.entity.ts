import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Poll } from './poll.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ModerationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pollId: number;

  @ManyToOne(() => Poll, (poll) => poll.moderationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: Poll;

  @Column()
  moderatorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'moderatorId' })
  moderator: User;

  @Column()
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'RESUBMITTED';

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
