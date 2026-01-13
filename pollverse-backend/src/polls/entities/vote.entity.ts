import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Poll } from './poll.entity';

@Entity()
@Unique(['userId', 'pollId']) // One vote per user per poll
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  pollId: number;

  @Column()
  optionId: string; // The option ID the user voted for

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Poll)
  @JoinColumn({ name: 'pollId' })
  poll: Poll;
}
