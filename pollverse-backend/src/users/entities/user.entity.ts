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

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  profession: string;

  @Column('simple-array', { nullable: true })
  interests: string[];

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column('simple-json', { nullable: true })
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };

  @Column('simple-array', { nullable: true })
  following: string[];

  @Column('simple-array', { nullable: true })
  followers: string[];

  @Column({ default: 0 })
  pollsCount: number;

  @Column({ default: 1 })
  trustLevel: number;
}
