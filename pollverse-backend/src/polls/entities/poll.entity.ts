import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

    @Column({ default: 'multiple_choice' })
    pollType: string;

    @Column('simple-json', { nullable: true })
    votes: Record<string, number>;

    @Column({ default: 0 })
    likes: number;

    @Column({ default: 0 })
    dislikes: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
