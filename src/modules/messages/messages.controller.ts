import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
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
  async findByChannel(@Param('channelId') channelId: string): Promise<MessageResponseDto[]> {
    return await this.messagesService.findByChannel(channelId);
  }

  /**
   * 특정 메시지 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MessageResponseDto> {
    return await this.messagesService.findOne(id);
  }

  /**
   * 메시지 업데이트
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MessageResponseDto> {
    return await this.messagesService.update(id, updateMessageDto, user.userId);
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
