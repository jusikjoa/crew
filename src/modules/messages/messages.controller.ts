import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface CurrentUserPayload {
  userId: string;
  email: string;
  username: string;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * 메시지 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MessageResponseDto> {
    return await this.messagesService.create(createMessageDto, user.userId);
  }

  /**
   * 모든 메시지 조회
   */
  @Get()
  async findAll(): Promise<MessageResponseDto[]> {
    return await this.messagesService.findAll();
  }

  /**
   * 특정 채널의 메시지 조회
   */
  @Get('channel/:channelId')
  @UseGuards(JwtAuthGuard)
  async findByChannel(
    @Param('channelId') channelId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MessageResponseDto[]> {
    return await this.messagesService.findByChannel(channelId, user.userId);
  }

  /**
   * 메시지 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.messagesService.remove(id, user.userId);
  }
}
