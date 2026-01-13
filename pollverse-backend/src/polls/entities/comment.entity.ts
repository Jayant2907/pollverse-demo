import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { Poll } from './poll.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @Column()
    userId: number;

    @Column()
    pollId: number;

    @Column({ default: 0 })
    likes: number;

    @Column({ nullable: true })
    parentId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne('Poll')
    @JoinColumn({ name: 'pollId' })
    poll: Poll;

    @ManyToOne(() => Comment, (comment) => comment.replies)
    @JoinColumn({ name: 'parentId' })
    parent: Comment;

    @Column({ default: 0 })
    replyCount: number;

    replies?: Comment[];
}
