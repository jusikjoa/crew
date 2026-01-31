import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
  import { Channel } from '../../channels/entities/channel.entity';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string; // 해시된 비밀번호 저장
  
    @Column()
    username: string;
  
    @Column({ unique: true, nullable: true })
    displayName: string | null;
  
    @Column({ default: true })
    isActive: boolean;
  
    @ManyToMany(() => Channel, (channel) => channel.members)
    @JoinTable({
      name: 'user_channels',
      joinColumn: { name: 'userId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'channelId', referencedColumnName: 'id' },
    })
    channels?: Channel[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }