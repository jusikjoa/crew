import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByChannel: jest.fn(),
    remove: jest.fn(),
  };

  const fixedDate = new Date('2026-01-10T10:46:10.610Z');

  const mockMessageResponse: MessageResponseDto = {
    id: 'message-1',
    content: 'Hello, world!',
    authorId: 'user-1',
    author: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      isActive: true,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    },
    channelId: 'channel-1',
    channel: {
      id: 'channel-1',
      name: 'general',
      description: '일반 채널',
      isPublic: true,
      createdBy: 'user-1',
      createdAt: fixedDate,
      updatedAt: fixedDate,
    },
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockCurrentUser = {
    userId: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
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
      mockMessagesService.create.mockResolvedValue(mockMessageResponse);

      const result = await controller.create(createMessageDto, mockCurrentUser);

      expect(result).toEqual(mockMessageResponse);
      expect(service.create).toHaveBeenCalledWith(createMessageDto, mockCurrentUser.userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('사용자 ID가 authorId에 저장되어야 함', async () => {
      mockMessagesService.create.mockResolvedValue(mockMessageResponse);

      const result = await controller.create(createMessageDto, mockCurrentUser);

      expect(result.authorId).toBe(mockCurrentUser.userId);
      expect(service.create).toHaveBeenCalledWith(createMessageDto, mockCurrentUser.userId);
    });
  });

  describe('findAll', () => {
    it('모든 메시지를 조회해야 함', async () => {
      const messages = [mockMessageResponse];
      mockMessagesService.findAll.mockResolvedValue(messages);

      const result = await controller.findAll();

      expect(result).toEqual(messages);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('메시지가 없으면 빈 배열을 반환해야 함', async () => {
      mockMessagesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByChannel', () => {
    it('특정 채널의 메시지를 조회해야 함', async () => {
      const messages = [mockMessageResponse];
      mockMessagesService.findByChannel.mockResolvedValue(messages);

      const result = await controller.findByChannel('channel-1', mockCurrentUser);

      expect(result).toEqual(messages);
      expect(service.findByChannel).toHaveBeenCalledWith('channel-1', mockCurrentUser.userId);
      expect(service.findByChannel).toHaveBeenCalledTimes(1);
    });

    it('채널에 메시지가 없으면 빈 배열을 반환해야 함', async () => {
      mockMessagesService.findByChannel.mockResolvedValue([]);

      const result = await controller.findByChannel('channel-1', mockCurrentUser);

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('메시지를 성공적으로 삭제해야 함', async () => {
      mockMessagesService.remove.mockResolvedValue(undefined);

      await controller.remove('message-1', mockCurrentUser);

      expect(service.remove).toHaveBeenCalledWith('message-1', mockCurrentUser.userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 메시지를 삭제하려고 하면 NotFoundException을 던져야 함', async () => {
      mockMessagesService.remove.mockRejectedValue(new NotFoundException('메시지를 찾을 수 없습니다.'));

      await expect(controller.remove('message-1', mockCurrentUser)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('message-1', mockCurrentUser.userId);
    });

    it('작성자가 아닌 사용자가 메시지를 삭제하려고 하면 ForbiddenException을 던져야 함', async () => {
      mockMessagesService.remove.mockRejectedValue(new ForbiddenException('메시지를 삭제할 권한이 없습니다.'));

      await expect(controller.remove('message-1', mockCurrentUser)).rejects.toThrow(ForbiddenException);
      expect(service.remove).toHaveBeenCalledWith('message-1', mockCurrentUser.userId);
    });
  });
});
