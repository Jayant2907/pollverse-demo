import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ default: 0 })
    points: number;

    @Column('simple-array', { nullable: true })
    following: string[];
}
