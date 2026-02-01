import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SystemConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 24 })
    reviewTimeLimitHours: number = 24;

    @Column({ default: 50 })
    penaltyPointsPerMiss: number = 50;

    @Column({ type: 'float', default: 1.0 })
    weightVotes: number = 1.0;

    @Column({ type: 'float', default: 2.0 })
    weightLikes: number = 2.0;

    @Column({ type: 'float', default: 1.5 })
    weightComments: number = 1.5;

    @Column({ type: 'float', default: 2.0 })
    paidPollBoostFactor: number = 2.0;

    @Column({ type: 'int', default: 3 })
    moderatorGroupSize: number = 3;

    @Column({ type: 'int', default: 1 })
    requiredApprovals: number = 1;
}
