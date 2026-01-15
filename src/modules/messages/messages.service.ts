import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { Channel } from '../channels/entities/channel.entity';
import { User } from '../users/entities/userEntity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ChannelResponseDto } from '../channels/dto/channel-response.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 메시지 생성
   */
  async create(createMessageDto: CreateMessageDto, authorId: string): Promise<MessageResponseDto> {
    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: createMessageDto.channelId },
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 작성자 존재 확인
    const author = await this.usersRepository.findOne({
      where: { id: authorId },
    });
    if (!author) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const message = this.messagesRepository.create({
      content: createMessageDto.content,
      authorId: authorId,
      channelId: createMessageDto.channelId,
    });

    const savedMessage = await this.messagesRepository.save(message);
    return this.toResponseDto(savedMessage);
  }

  /**
   * 모든 메시지 조회
   */
  async findAll(): Promise<MessageResponseDto[]> {
    const messages = await this.messagesRepository.find({
      relations: ['author', 'channel'],
      order: { createdAt: 'DESC' },
    });
    return messages.map(message => this.toResponseDto(message));
  }

  /**
   * 특정 채널의 메시지 조회
   */
  async findByChannel(channelId: string): Promise<MessageResponseDto[]> {
    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    const messages = await this.messagesRepository.find({
      where: { channelId },
      relations: ['author', 'channel'],
      order: { createdAt: 'ASC' },
    });
    return messages.map(message => this.toResponseDto(message));
  }

  /**
   * ID로 메시지 조회
   */
  async findOne(id: string): Promise<MessageResponseDto> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['author', 'channel'],
    });
    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }
    return this.toResponseDto(message);
  }

  /**
   * 메시지 업데이트
   */
  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<MessageResponseDto> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['author', 'channel'],
    });
    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    // 권한 체크: 메시지 작성자만 업데이트 가능
    if (message.authorId !== userId) {
      throw new ForbiddenException('메시지를 수정할 권한이 없습니다.');
    }

    if (updateMessageDto.content !== undefined) {
      message.content = updateMessageDto.content;
    }

    const updatedMessage = await this.messagesRepository.save(message);
    return this.toResponseDto(updatedMessage);
  }

  /**
   * 메시지 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id },
    });
    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    // 권한 체크: 메시지 작성자만 삭제 가능
    if (message.authorId !== userId) {
      throw new ForbiddenException('메시지를 삭제할 권한이 없습니다.');
    }

    await this.messagesRepository.remove(message);
  }

  /**
   * Message 엔티티를 MessageResponseDto로 변환
   */
  private toResponseDto(message: Message): MessageResponseDto {
    const dto: MessageResponseDto = {
      id: message.id,
      content: message.content,
      authorId: message.authorId,
      channelId: message.channelId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    // author 관계가 로드된 경우
    if (message.author) {
      dto.author = this.excludePassword(message.author);
    }

    // channel 관계가 로드된 경우
    if (message.channel) {
      dto.channel = {
        id: message.channel.id,
        name: message.channel.name,
        description: message.channel.description,
        isPublic: message.channel.isPublic,
        createdBy: message.channel.createdBy,
        createdAt: message.channel.createdAt,
        updatedAt: message.channel.updatedAt,
      };
    }

    return dto;
  }

  /**
   * User 엔티티에서 비밀번호 제외
   */
  private excludePassword(user: User): UserResponseDto {
    const { password, channels, ...userResponse } = user;
    return userResponse;
  }
}
