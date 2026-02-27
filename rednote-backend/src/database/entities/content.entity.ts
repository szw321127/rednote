import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  topic: string;

  @Column({ default: 'outline' })
  status: string; // 'outline' | 'completed'

  @Column({ type: 'simple-json', nullable: true })
  outlines: Array<{
    title: string;
    content: string;
    emoji: string;
    tags: string[];
  }>;

  @Column({ type: 'simple-json', nullable: true })
  completedContents: Array<{
    outlineTitle: string;
    imageUrl: string;
    caption: string;
    createdAt: number;
  }>;

  @Column({ nullable: true })
  textModel: string;

  @Column({ nullable: true })
  imageModel: string;

  @Column({ type: 'float', nullable: true })
  qualityScore?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
