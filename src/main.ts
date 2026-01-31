import 'reflect-metadata';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// .env 파일 로드 (가장 먼저 실행)
config();

async function bootstrap() {
  const useHttps = process.env.USE_HTTPS === 'true';
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined;
  if (useHttps && sslKeyPath && sslCertPath) {
    const keyPath = path.isAbsolute(sslKeyPath) ? sslKeyPath : path.join(process.cwd(), sslKeyPath);
    const certPath = path.isAbsolute(sslCertPath) ? sslCertPath : path.join(process.cwd(), sslCertPath);
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('[HTTPS] 인증서 로드 완료');
    } else {
      console.warn('[HTTPS] 인증서 파일을 찾을 수 없습니다. HTTP로 실행합니다.');
      console.warn('  key:', keyPath, fs.existsSync(keyPath) ? '✓' : '✗');
      console.warn('  cert:', certPath, fs.existsSync(certPath) ? '✓' : '✗');
    }
  }

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});

  // CORS 설정 - 모든 origin 허용 (개발 환경)
  app.enableCors({
    origin: true, // 모든 origin 허용
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 3600, // preflight 요청 캐시 시간 (초)
  });
  
  // 전역 ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 요청 거부
      transform: true, // 자동 타입 변환
    }),
  );
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  
  await app.listen(port, '0.0.0.0');
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`Application is running on: ${protocol}://localhost:${port}`);
}
bootstrap();
