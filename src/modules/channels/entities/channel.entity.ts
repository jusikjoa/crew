import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/userEntity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ default: true })
  isPublic: boolean; // 공개 채널 여부

  @Column({ nullable: true })
  createdBy: string; // 생성자 ID (User와의 관계)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToMany(() => User, (user) => user.channels)
  members?: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

