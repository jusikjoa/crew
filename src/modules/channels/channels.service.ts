import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
  ) {}

  /**
   * 채널 생성
   */
  async create(createChannelDto: CreateChannelDto, createdBy?: string): Promise<ChannelResponseDto> {
    // 채널명 중복 확인
    const existingChannel = await this.channelsRepository.findOne({
      where: { name: createChannelDto.name },
    });
    if (existingChannel) {
      throw new ConflictException('이미 존재하는 채널 이름입니다.');
    }

    const channel = this.channelsRepository.create({
      name: createChannelDto.name,
      description: createChannelDto.description || null,
      isPublic: createChannelDto.isPublic !== undefined ? createChannelDto.isPublic : true,
      createdBy: createdBy || null,
    });

    const savedChannel = await this.channelsRepository.save(channel);
    return this.toResponseDto(savedChannel);
  }

  /**
   * 모든 채널 조회
   */
  async findAll(): Promise<ChannelResponseDto[]> {
    const channels = await this.channelsRepository.find({
      order: { createdAt: 'DESC' },
    });
    return channels.map(channel => this.toResponseDto(channel));
  }

  /**
   * ID로 채널 조회
   */
  async findOne(id: string): Promise<ChannelResponseDto> {
    const channel = await this.channelsRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }
    return this.toResponseDto(channel);
  }

  /**
   * 채널 업데이트
   */
  async update(id: string, updateChannelDto: UpdateChannelDto, userId: string): Promise<ChannelResponseDto> {
    const channel = await this.channelsRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 권한 체크: 채널 생성자만 업데이트 가능
    if (channel.createdBy !== userId) {
      throw new ForbiddenException('채널을 수정할 권한이 없습니다.');
    }

    // 이름 변경 시 중복 확인
    if (updateChannelDto.name && updateChannelDto.name !== channel.name) {
      const existingChannel = await this.channelsRepository.findOne({
        where: { name: updateChannelDto.name },
      });
      if (existingChannel) {
        throw new ConflictException('이미 존재하는 채널 이름입니다.');
      }
    }

    Object.assign(channel, updateChannelDto);
    const updatedChannel = await this.channelsRepository.save(channel);
    return this.toResponseDto(updatedChannel);
  }

  /**
   * 채널 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const channel = await this.channelsRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 권한 체크: 채널 생성자만 삭제 가능
    if (channel.createdBy !== userId) {
      throw new ForbiddenException('채널을 삭제할 권한이 없습니다.');
    }

    await this.channelsRepository.remove(channel);
  }

  /**
   * Entity를 ResponseDto로 변환
   */
  private toResponseDto(channel: Channel): ChannelResponseDto {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      isPublic: channel.isPublic,
      createdBy: channel.createdBy,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}

