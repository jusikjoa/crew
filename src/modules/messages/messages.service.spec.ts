import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { Channel } from '../channels/entities/channel.entity';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepository: Repository<Message>;
  let channelRepository: Repository<Channel>;
  let userRepository: Repository<User>;

  const mockMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockChannelRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const fixedDate = new Date('2026-01-10T10:46:10.610Z');

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    channels: undefined,
  };

  const mockUserResponse: any = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockChannel: Channel = {
    id: 'channel-1',
    name: 'general',
    description: '일반 채널',
    isPublic: true,
    password: null,
    createdBy: 'user-1',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    creator: undefined,
    members: [mockUser],
  };

  const mockChannelResponse: any = {
    id: 'channel-1',
    name: 'general',
    description: '일반 채널',
    isPublic: true,
    createdBy: 'user-1',
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockMessage: Message = {
    id: 'message-1',
    content: 'Hello, world!',
    authorId: 'user-1',
    author: mockUser,
    channelId: 'channel-1',
    channel: mockChannel,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockMessageResponse: MessageResponseDto = {
    id: 'message-1',
    content: 'Hello, world!',
    authorId: 'user-1',
    author: mockUserResponse,
    channelId: 'channel-1',
    channel: mockChannelResponse,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        {
          provide: getRepositoryToken(Channel),
          useValue: mockChannelRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageRepository = module.get<Repository<Message>>(getRepositoryToken(Message));
    channelRepository = module.get<Repository<Channel>>(getRepositoryToken(Channel));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createMessageDto: CreateMessageDto = {
      content: 'Hello, world!',
      channelId: 'channel-1',
    };

    it('메시지를 성공적으로 생성해야 함', async () => {
      const channelWithMembers = { ...mockChannel, members: [mockUser] };
      mockChannelRepository.findOne.mockResolvedValue(channelWithMembers);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.create(createMessageDto, 'user-1');

      expect(result).toEqual(mockMessageResponse);
      expect(mockChannelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        relations: ['members'],
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        content: 'Hello, world!',
        authorId: 'user-1',
        channelId: 'channel-1',
      });
      expect(mockMessageRepository.save).toHaveBeenCalledWith(mockMessage);
    });

    it('존재하지 않는 채널에 메시지를 생성하려고 하면 NotFoundException을 던져야 함', async () => {
      mockChannelRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createMessageDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockChannelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        relations: ['members'],
      });
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
    });

    it('채널 멤버가 아닌 사용자가 메시지를 생성하려고 하면 ForbiddenException을 던져야 함', async () => {
      const channelWithoutUser = { ...mockChannel, members: [] };
      mockChannelRepository.findOne.mockResolvedValue(channelWithoutUser);

      await expect(service.create(createMessageDto, 'user-1')).rejects.toThrow(ForbiddenException);
      expect(mockChannelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        relations: ['members'],
      });
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자가 메시지를 생성하려고 하면 NotFoundException을 던져야 함', async () => {
      const channelWithMembers = { ...mockChannel, members: [mockUser] };
      mockChannelRepository.findOne.mockResolvedValue(channelWithMembers);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createMessageDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('모든 메시지를 조회해야 함', async () => {
      const messages = [mockMessage];
      mockMessageRepository.find.mockResolvedValue(messages);

      const result = await service.findAll();

      expect(result).toEqual([mockMessageResponse]);
      expect(mockMessageRepository.find).toHaveBeenCalledWith({
        relations: ['author', 'channel'],
        order: { createdAt: 'DESC' },
      });
    });

    it('메시지가 없으면 빈 배열을 반환해야 함', async () => {
      mockMessageRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByChannel', () => {
    it('특정 채널의 메시지를 조회해야 함', async () => {
      const messages = [mockMessage];
      const channelWithMembers = { ...mockChannel, members: [mockUser] };
      mockChannelRepository.findOne.mockResolvedValue(channelWithMembers);
      mockMessageRepository.find.mockResolvedValue(messages);

      const result = await service.findByChannel('channel-1', 'user-1');

      expect(result).toEqual([mockMessageResponse]);
      expect(mockChannelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        relations: ['members'],
      });
      expect(mockMessageRepository.find).toHaveBeenCalledWith({
        where: { channelId: 'channel-1' },
        relations: ['author', 'channel'],
        order: { createdAt: 'ASC' },
      });
    });

    it('존재하지 않는 채널의 메시지를 조회하려고 하면 NotFoundException을 던져야 함', async () => {
      mockChannelRepository.findOne.mockResolvedValue(null);

      await expect(service.findByChannel('channel-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockMessageRepository.find).not.toHaveBeenCalled();
    });

    it('채널 멤버가 아닌 사용자가 메시지를 조회하려고 하면 ForbiddenException을 던져야 함', async () => {
      const channelWithoutUser = { ...mockChannel, members: [] };
      mockChannelRepository.findOne.mockResolvedValue(channelWithoutUser);

      await expect(service.findByChannel('channel-1', 'user-1')).rejects.toThrow(ForbiddenException);
      expect(mockMessageRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('메시지를 성공적으로 삭제해야 함', async () => {
      const messageWithChannel = { ...mockMessage, channel: mockChannel };
      const channelWithMembers = { ...mockChannel, members: [mockUser] };
      mockMessageRepository.findOne.mockResolvedValue(messageWithChannel);
      mockChannelRepository.findOne.mockResolvedValue(channelWithMembers);
      mockMessageRepository.remove.mockResolvedValue(mockMessage);

      await service.remove('message-1', 'user-1');

      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'message-1' },
        relations: ['channel'],
      });
      expect(mockChannelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        relations: ['members'],
      });
      expect(mockMessageRepository.remove).toHaveBeenCalledWith(messageWithChannel);
    });

    it('존재하지 않는 메시지를 삭제하려고 하면 NotFoundException을 던져야 함', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('message-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockMessageRepository.remove).not.toHaveBeenCalled();
    });

    it('작성자가 아닌 사용자가 메시지를 삭제하려고 하면 ForbiddenException을 던져야 함', async () => {
      mockMessageRepository.findOne.mockResolvedValue(mockMessage);

      await expect(service.remove('message-1', 'user-2')).rejects.toThrow(ForbiddenException);
      expect(mockChannelRepository.findOne).not.toHaveBeenCalled();
      expect(mockMessageRepository.remove).not.toHaveBeenCalled();
    });

    it('채널 멤버가 아닌 사용자가 메시지를 삭제하려고 하면 ForbiddenException을 던져야 함', async () => {
      const messageWithChannel = { ...mockMessage, channel: mockChannel };
      const channelWithoutUser = { ...mockChannel, members: [] };
      mockMessageRepository.findOne.mockResolvedValue(messageWithChannel);
      mockChannelRepository.findOne.mockResolvedValue(channelWithoutUser);

      await expect(service.remove('message-1', 'user-1')).rejects.toThrow(ForbiddenException);
      expect(mockMessageRepository.remove).not.toHaveBeenCalled();
    });
  });
});
