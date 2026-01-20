import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JoinChannelDto } from './dto/join-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';

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

    // 비밀번호가 제공된 경우 해시화
    let hashedPassword: string | null = null;
    if (createChannelDto.password) {
      hashedPassword = await bcrypt.hash(createChannelDto.password, 10);
    }

    const channel = this.channelsRepository.create({
      name: createChannelDto.name,
      description: createChannelDto.description || null,
      isPublic: createChannelDto.isPublic !== undefined ? createChannelDto.isPublic : true,
      isDM: createChannelDto.isDM !== undefined ? createChannelDto.isDM : false,
      password: hashedPassword,
      createdBy: createdBy || null,
    });

    const savedChannel = await this.channelsRepository.save(channel);

    // DM 채널인 경우 처리
    if (savedChannel.isDM) {
      if (!createdBy) {
        throw new BadRequestException('DM 채널 생성 시 생성자 정보가 필요합니다.');
      }

      if (!createChannelDto.recipientId) {
        throw new BadRequestException('DM 채널 생성 시 상대방 ID(recipientId)가 필요합니다.');
      }

      // 생성자와 상대방이 같은 경우 방지
      if (createdBy === createChannelDto.recipientId) {
        throw new BadRequestException('자기 자신과 DM 채널을 생성할 수 없습니다.');
      }

      // 생성자 조회
      const creator = await this.usersRepository.findOne({
        where: { id: createdBy },
        relations: ['channels'],
      });

      if (!creator) {
        throw new NotFoundException('생성자를 찾을 수 없습니다.');
      }

      // 상대방 조회
      const recipient = await this.usersRepository.findOne({
        where: { id: createChannelDto.recipientId },
        relations: ['channels'],
      });

      if (!recipient) {
        throw new NotFoundException('상대방 사용자를 찾을 수 없습니다.');
      }

      // 두 사용자를 모두 채널 멤버로 추가
      savedChannel.members = [creator, recipient];
      await this.channelsRepository.save(savedChannel);

      // 생성자의 channels에 채널 추가
      if (!creator.channels) {
        creator.channels = [];
      }
      creator.channels.push(savedChannel);
      await this.usersRepository.save(creator);

      // 상대방의 channels에 채널 추가
      if (!recipient.channels) {
        recipient.channels = [];
      }
      recipient.channels.push(savedChannel);
      await this.usersRepository.save(recipient);
    } else if (createdBy) {
      // 일반 채널인 경우, 생성자를 자동으로 채널 멤버에 추가
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
   * 모든 채널 조회 (DM 채널 제외)
   */
  async findAll(): Promise<ChannelResponseDto[]> {
    const channels = await this.channelsRepository.find({
      where: { isDM: false },
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

    // 비밀번호 변경 시 해시화
    if (updateChannelDto.password) {
      channel.password = await bcrypt.hash(updateChannelDto.password, 10);
    }

    // 비밀번호를 제외한 나머지 필드 업데이트
    const { password, ...updateDataWithoutPassword } = updateChannelDto;
    Object.assign(channel, updateDataWithoutPassword);
    const updatedChannel = await this.channelsRepository.save(channel);
    return this.toResponseDto(updatedChannel);
  }

  /**
   * 채널 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const channel = await this.channelsRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 권한 체크: 채널 생성자만 삭제 가능
    if (channel.createdBy !== userId) {
      throw new ForbiddenException('채널을 삭제할 권한이 없습니다.');
    }

    // Many-to-Many 관계 제거
    if (channel.members && channel.members.length > 0) {
      channel.members = [];
      await this.channelsRepository.save(channel);
    }

    // 채널 삭제 (CASCADE로 인해 관련 메시지도 자동 삭제됨)
    await this.channelsRepository.remove(channel);
  }

  /**
   * 채널 참여
   */
  async joinChannel(channelId: string, userId: string, joinChannelDto?: JoinChannelDto): Promise<ChannelResponseDto> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['members'],
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 비공개 채널인 경우 비밀번호 검증 필요
    if (channel.isPublic === false) {
      // 비밀번호가 설정되어 있는 경우
      if (channel.password) {
        // 요청에 비밀번호가 없거나 틀린 경우
        if (!joinChannelDto?.password) {
          throw new UnauthorizedException('비공개 채널 참여를 위해서는 비밀번호가 필요합니다.');
        }
        const isPasswordValid = await bcrypt.compare(joinChannelDto.password, channel.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('채널 비밀번호가 올바르지 않습니다.');
        }
      } else {
        // 비밀번호가 설정되지 않은 비공개 채널은 참여 불가
        throw new ForbiddenException('비공개 채널에는 참여할 수 없습니다.');
      }
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
   * 채널의 참가자 목록 조회
   */
  async findChannelMembers(channelId: string): Promise<UserResponseDto[]> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['members'],
    });

    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    if (!channel.members || channel.members.length === 0) {
      return [];
    }

    return channel.members.map(member => this.excludePassword(member));
  }

  /**
   * 비밀번호를 제외한 사용자 정보 반환 헬퍼 메서드
   */
  private excludePassword(user: User): UserResponseDto {
    const { password, channels, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
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
      isDM: channel.isDM,
      createdBy: channel.createdBy,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}

