import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    password: string; // In production, store hashed password

    @Column({ default: 0 })
    points: number;

    @Column('simple-array', { nullable: true })
    following: string[];
}
