import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class PointTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    reason: 'vote' | 'create_poll' | 'trending_bonus' | 'survey_complete' | 'swipe_bonus' | 'comment_like' | 'follow' | 'other';

    @Column()
    points: number;

    @Column({ type: 'simple-json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;
}
