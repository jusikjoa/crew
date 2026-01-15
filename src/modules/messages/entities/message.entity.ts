import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/userEntity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  authorId: string; // 작성자 ID

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author?: User;

  @Column()
  channelId: string; // 채널 ID

  @ManyToOne(() => Channel, { nullable: false })
  @JoinColumn({ name: 'channelId' })
  channel?: Channel;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
