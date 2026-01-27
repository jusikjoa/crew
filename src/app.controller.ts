import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health-check')
  getHello(): string {
    return 'Slack-lite 서버가 정상적으로 동작 중입니다!-CI-CD 적용 🚀';
  }
}