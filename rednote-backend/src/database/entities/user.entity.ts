import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Content } from './content.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ default: 'free' })
  plan: string; // 'free' | 'pro' | 'enterprise'

  @Column({ default: 50 })
  quotaLimit: number; // monthly generation limit

  @Column({ default: 0 })
  quotaUsed: number; // current month usage

  @Column({ nullable: true })
  quotaResetAt: Date;

  @Column({ nullable: true })
  fingerprint: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Content, (content) => content.user)
  contents: Content[];
}
