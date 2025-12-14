import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Poll } from '../../polls/entities/poll.entity';

@Entity()
@Unique(['userId', 'pollId']) // One interaction per user per poll
export class Interaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    pollId: number;

    @Column({ type: 'varchar', nullable: true }) // 'like' or 'dislike' or null
    type: 'like' | 'dislike' | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Poll)
    @JoinColumn({ name: 'pollId' })
    poll: Poll;
}
