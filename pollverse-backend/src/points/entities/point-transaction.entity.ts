import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export type ActionType = 'VOTE' | 'CREATE_POLL' | 'FOLLOW' | 'LIKE_COMMENT' | 'TRENDING_BONUS' | 'SURVEY_COMPLETE' | 'SWIPE_BONUS' | 'CLAWBACK';

@Entity()
@Index(['userId', 'actionType', 'targetId']) // Composite index for duplicate checks
export class PointTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    userId: number; // The earner

    @Column({ nullable: true })
    targetId: number; // The object ID (Poll ID, User ID followed, Comment ID)

    @Column({ type: 'varchar', length: 50, nullable: true })
    actionType: ActionType; // The specific category of engagement

    @Column()
    points: number; // Can be negative for clawbacks

    @Column({ type: 'simple-json', nullable: true })
    metadata: Record<string, any>; // Human-readable strings for UI

    @Column({ type: 'varchar', length: 50, nullable: true })
    reason: string; // Legacy field for backward compatibility

    @CreateDateColumn()
    createdAt: Date;
}
