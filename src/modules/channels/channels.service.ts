import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { User } from '../users/entities/userEntity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

    // createdBy가 있는 경우, 생성자를 자동으로 채널 멤버에 추가
    if (createdBy) {
      const creator = await this.usersRepository.findOne({
        where: { id: createdBy },
        relations: ['channels'],
      });

      if (creator) {
        // 채널의 members에 생성자 추가
        savedChannel.members = [creator];
        await this.channelsRepository.save(savedChannel);

        // 사용자의 channels에 채널 추가
        if (!creator.channels) {
          creator.channels = [];
        }
        creator.channels.push(savedChannel);
        await this.usersRepository.save(creator);
      }
    }

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
   * 채널 참여
   */
  async joinChannel(channelId: string, userId: string): Promise<ChannelResponseDto> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['members'],
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이미 참여 중인지 확인
    if (channel.members && channel.members.some(member => member.id === userId)) {
      throw new ConflictException('이미 참여 중인 채널입니다.');
    }

    // 채널에 사용자 추가
    if (!channel.members) {
      channel.members = [];
    }
    channel.members.push(user);
    await this.channelsRepository.save(channel);

    return this.toResponseDto(channel);
  }

  /**
   * 채널 탈퇴
   */
  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['members'],
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    if (!channel.members || !channel.members.some(member => member.id === userId)) {
      throw new BadRequestException('참여하지 않은 채널입니다.');
    }

    // 채널에서 사용자 제거
    channel.members = channel.members.filter(member => member.id !== userId);
    await this.channelsRepository.save(channel);
  }

  /**
   * 사용자가 참여한 채널 목록 조회
   */
  async findUserChannels(userId: string): Promise<ChannelResponseDto[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['channels'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.channels || user.channels.length === 0) {
      return [];
    }

    return user.channels.map(channel => this.toResponseDto(channel));
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

