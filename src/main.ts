import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000); // 3000번 포트로 실행
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();