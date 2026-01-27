import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { User } from './modules/users/entities/user.entity';
import { Channel } from './modules/channels/entities/channel.entity';
import { Message } from './modules/messages/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 전역으로 설정하여 모든 모듈에서 사용 가능
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'data/crew.db', // 데이터베이스 파일 경로
      entities: [User, Channel, Message],
      synchronize: true, // 개발 환경에서만 true
      logging: true,
    }),
    UsersModule,
    AuthModule,
    ChannelsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}