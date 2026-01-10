import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/entities/userEntity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite', // 또는 'sqlite'
      database: 'crew.db', // 프로젝트 루트에 생성될 DB 파일
      entities: [User],
      synchronize: true, // 개발 환경에서만 true
      logging: true,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}