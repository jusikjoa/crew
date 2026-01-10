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
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface CurrentUserPayload {
  userId: string;
  email: string;
  username: string;
}

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * 채널 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createChannelDto: CreateChannelDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ChannelResponseDto> {
    return await this.channelsService.create(createChannelDto, user.userId);
  }

  /**
   * 모든 채널 조회
   */
  @Get()
  async findAll(): Promise<ChannelResponseDto[]> {
    return await this.channelsService.findAll();
  }

  /**
   * 특정 채널 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChannelResponseDto> {
    return await this.channelsService.findOne(id);
  }

  /**
   * 채널 업데이트
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ChannelResponseDto> {
    return await this.channelsService.update(id, updateChannelDto, user.userId);
  }

  /**
   * 채널 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.channelsService.remove(id, user.userId);
  }
}

