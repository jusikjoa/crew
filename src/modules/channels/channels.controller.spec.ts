import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let service: ChannelsService;

  const mockChannelsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUserChannels: jest.fn(),
    joinChannel: jest.fn(),
    leaveChannel: jest.fn(),
  };

  const mockChannelResponse: ChannelResponseDto = {
    id: '1',
    name: 'general',
    description: '일반 채널',
    isPublic: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrentUser = {
    userId: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        {
          provide: ChannelsService,
          useValue: mockChannelsService,
        },
      ],
    }).compile();

    controller = module.get<ChannelsController>(ChannelsController);
    service = module.get<ChannelsService>(ChannelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createChannelDto: CreateChannelDto = {
      name: 'general',
      description: '일반 채널',
      isPublic: true,
    };

    it('채널을 성공적으로 생성해야 함', async () => {
      mockChannelsService.create.mockResolvedValue(mockChannelResponse);

      const result = await controller.create(createChannelDto, mockCurrentUser);

      expect(result).toEqual(mockChannelResponse);
      expect(service.create).toHaveBeenCalledWith(createChannelDto, mockCurrentUser.userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('사용자 ID가 createdBy에 저장되어야 함', async () => {
      mockChannelsService.create.mockResolvedValue(mockChannelResponse);

      const result = await controller.create(createChannelDto, mockCurrentUser);

      expect(result.createdBy).toBe(mockCurrentUser.userId);
      expect(service.create).toHaveBeenCalledWith(createChannelDto, mockCurrentUser.userId);
    });

    it('description 없이 채널을 생성할 수 있어야 함', async () => {
      const createDtoWithoutDescription: CreateChannelDto = {
        name: 'general',
        isPublic: true,
      };
      const channelWithoutDescription = { ...mockChannelResponse, description: null };
      mockChannelsService.create.mockResolvedValue(channelWithoutDescription);

      const result = await controller.create(createDtoWithoutDescription, mockCurrentUser);

      expect(result).toEqual(channelWithoutDescription);
      expect(service.create).toHaveBeenCalledWith(
        createDtoWithoutDescription,
        mockCurrentUser.userId,
      );
    });

    it('이미 존재하는 채널명으로 생성 시 ConflictException을 던져야 함', async () => {
      mockChannelsService.create.mockRejectedValue(
        new ConflictException('이미 존재하는 채널 이름입니다.'),
      );

      await expect(controller.create(createChannelDto, mockCurrentUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.create(createChannelDto, mockCurrentUser)).rejects.toThrow(
        '이미 존재하는 채널 이름입니다.',
      );

      expect(service.create).toHaveBeenCalledWith(createChannelDto, mockCurrentUser.userId);
    });
  });

  describe('findAll', () => {
    it('모든 채널을 조회해야 함', async () => {
      const channels = [mockChannelResponse];
      mockChannelsService.findAll.mockResolvedValue(channels);

      const result = await controller.findAll();

      expect(result).toEqual(channels);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('채널이 없을 때 빈 배열을 반환해야 함', async () => {
      mockChannelsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('ID로 채널을 조회해야 함', async () => {
      const channelId = '1';
      mockChannelsService.findOne.mockResolvedValue(mockChannelResponse);

      const result = await controller.findOne(channelId);

      expect(result).toEqual(mockChannelResponse);
      expect(service.findOne).toHaveBeenCalledWith(channelId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 채널 조회 시 NotFoundException을 던져야 함', async () => {
      const channelId = '999';
      mockChannelsService.findOne.mockRejectedValue(
        new NotFoundException('채널을 찾을 수 없습니다.'),
      );

      await expect(controller.findOne(channelId)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(channelId)).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(service.findOne).toHaveBeenCalledWith(channelId);
    });
  });

  describe('update', () => {
    const channelId = '1';
    const updateChannelDto: UpdateChannelDto = {
      name: 'updated-channel',
      description: '업데이트된 설명',
      isPublic: false,
    };

    it('채널을 성공적으로 업데이트해야 함', async () => {
      const updatedChannel = { ...mockChannelResponse, ...updateChannelDto };
      mockChannelsService.update.mockResolvedValue(updatedChannel);

      const result = await controller.update(channelId, updateChannelDto, mockCurrentUser);

      expect(result).toEqual(updatedChannel);
      expect(service.update).toHaveBeenCalledWith(
        channelId,
        updateChannelDto,
        mockCurrentUser.userId,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('일부 필드만 업데이트할 수 있어야 함', async () => {
      const partialUpdateDto: UpdateChannelDto = {
        description: '새로운 설명',
      };
      const updatedChannel = { ...mockChannelResponse, description: '새로운 설명' };
      mockChannelsService.update.mockResolvedValue(updatedChannel);

      const result = await controller.update(channelId, partialUpdateDto, mockCurrentUser);

      expect(result).toEqual(updatedChannel);
      expect(service.update).toHaveBeenCalledWith(
        channelId,
        partialUpdateDto,
        mockCurrentUser.userId,
      );
    });

    it('존재하지 않는 채널 업데이트 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.update.mockRejectedValue(
        new NotFoundException('채널을 찾을 수 없습니다.'),
      );

      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        '채널을 찾을 수 없습니다.',
      );
    });

    it('권한이 없는 사용자가 업데이트 시 ForbiddenException을 던져야 함', async () => {
      mockChannelsService.update.mockRejectedValue(
        new ForbiddenException('채널을 수정할 권한이 없습니다.'),
      );

      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        '채널을 수정할 권한이 없습니다.',
      );

      expect(service.update).toHaveBeenCalledWith(
        channelId,
        updateChannelDto,
        mockCurrentUser.userId,
      );
    });

    it('이미 존재하는 채널명으로 업데이트 시 ConflictException을 던져야 함', async () => {
      mockChannelsService.update.mockRejectedValue(
        new ConflictException('이미 존재하는 채널 이름입니다.'),
      );

      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.update(channelId, updateChannelDto, mockCurrentUser)).rejects.toThrow(
        '이미 존재하는 채널 이름입니다.',
      );
    });
  });

  describe('remove', () => {
    const channelId = '1';

    it('채널을 성공적으로 삭제해야 함', async () => {
      mockChannelsService.remove.mockResolvedValue(undefined);

      await controller.remove(channelId, mockCurrentUser);

      expect(service.remove).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 채널 삭제 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.remove.mockRejectedValue(
        new NotFoundException('채널을 찾을 수 없습니다.'),
      );

      await expect(controller.remove(channelId, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove(channelId, mockCurrentUser)).rejects.toThrow(
        '채널을 찾을 수 없습니다.',
      );

      expect(service.remove).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
    });

    it('권한이 없는 사용자가 삭제 시 ForbiddenException을 던져야 함', async () => {
      mockChannelsService.remove.mockRejectedValue(
        new ForbiddenException('채널을 삭제할 권한이 없습니다.'),
      );

      await expect(controller.remove(channelId, mockCurrentUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.remove(channelId, mockCurrentUser)).rejects.toThrow(
        '채널을 삭제할 권한이 없습니다.',
      );

      expect(service.remove).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
    });
  });

  describe('findMyChannels', () => {
    it('내가 참여한 채널 목록을 조회해야 함', async () => {
      const channels = [mockChannelResponse];
      mockChannelsService.findUserChannels.mockResolvedValue(channels);

      const result = await controller.findMyChannels(mockCurrentUser);

      expect(result).toEqual(channels);
      expect(service.findUserChannels).toHaveBeenCalledWith(mockCurrentUser.userId);
      expect(service.findUserChannels).toHaveBeenCalledTimes(1);
    });

    it('참여한 채널이 없을 때 빈 배열을 반환해야 함', async () => {
      mockChannelsService.findUserChannels.mockResolvedValue([]);

      const result = await controller.findMyChannels(mockCurrentUser);

      expect(result).toEqual([]);
      expect(service.findUserChannels).toHaveBeenCalledWith(mockCurrentUser.userId);
    });

    it('여러 채널에 참여한 경우 모두 반환해야 함', async () => {
      const secondChannel: ChannelResponseDto = {
        id: '2',
        name: 'random',
        description: '랜덤 채널',
        isPublic: true,
        createdBy: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const channels = [mockChannelResponse, secondChannel];
      mockChannelsService.findUserChannels.mockResolvedValue(channels);

      const result = await controller.findMyChannels(mockCurrentUser);

      expect(result).toHaveLength(2);
      expect(result).toEqual(channels);
      expect(service.findUserChannels).toHaveBeenCalledWith(mockCurrentUser.userId);
    });

    it('존재하지 않는 사용자 조회 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.findUserChannels.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.findMyChannels(mockCurrentUser)).rejects.toThrow(NotFoundException);
      await expect(controller.findMyChannels(mockCurrentUser)).rejects.toThrow('사용자를 찾을 수 없습니다.');

      expect(service.findUserChannels).toHaveBeenCalledWith(mockCurrentUser.userId);
    });
  });

  describe('joinChannel', () => {
    const channelId = '1';

    it('채널에 성공적으로 참여해야 함', async () => {
      mockChannelsService.joinChannel.mockResolvedValue(mockChannelResponse);

      const result = await controller.joinChannel(channelId, mockCurrentUser);

      expect(result).toEqual(mockChannelResponse);
      expect(service.joinChannel).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
      expect(service.joinChannel).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 채널 참여 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.joinChannel.mockRejectedValue(
        new NotFoundException('채널을 찾을 수 없습니다.'),
      );

      await expect(controller.joinChannel('999', mockCurrentUser)).rejects.toThrow(NotFoundException);
      await expect(controller.joinChannel('999', mockCurrentUser)).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(service.joinChannel).toHaveBeenCalledWith('999', mockCurrentUser.userId);
    });

    it('이미 참여 중인 채널에 참여 시 ConflictException을 던져야 함', async () => {
      mockChannelsService.joinChannel.mockRejectedValue(
        new ConflictException('이미 참여 중인 채널입니다.'),
      );

      await expect(controller.joinChannel(channelId, mockCurrentUser)).rejects.toThrow(ConflictException);
      await expect(controller.joinChannel(channelId, mockCurrentUser)).rejects.toThrow('이미 참여 중인 채널입니다.');

      expect(service.joinChannel).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
    });

    it('존재하지 않는 사용자가 참여 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.joinChannel.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.joinChannel(channelId, mockCurrentUser)).rejects.toThrow(NotFoundException);
      await expect(controller.joinChannel(channelId, mockCurrentUser)).rejects.toThrow('사용자를 찾을 수 없습니다.');

      expect(service.joinChannel).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
    });
  });

  describe('leaveChannel', () => {
    const channelId = '1';

    it('채널에서 성공적으로 탈퇴해야 함', async () => {
      mockChannelsService.leaveChannel.mockResolvedValue(undefined);

      await controller.leaveChannel(channelId, mockCurrentUser);

      expect(service.leaveChannel).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
      expect(service.leaveChannel).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 채널 탈퇴 시 NotFoundException을 던져야 함', async () => {
      mockChannelsService.leaveChannel.mockRejectedValue(
        new NotFoundException('채널을 찾을 수 없습니다.'),
      );

      await expect(controller.leaveChannel('999', mockCurrentUser)).rejects.toThrow(NotFoundException);
      await expect(controller.leaveChannel('999', mockCurrentUser)).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(service.leaveChannel).toHaveBeenCalledWith('999', mockCurrentUser.userId);
    });

    it('참여하지 않은 채널 탈퇴 시 BadRequestException을 던져야 함', async () => {
      mockChannelsService.leaveChannel.mockRejectedValue(
        new BadRequestException('참여하지 않은 채널입니다.'),
      );

      await expect(controller.leaveChannel(channelId, mockCurrentUser)).rejects.toThrow(BadRequestException);
      await expect(controller.leaveChannel(channelId, mockCurrentUser)).rejects.toThrow('참여하지 않은 채널입니다.');

      expect(service.leaveChannel).toHaveBeenCalledWith(channelId, mockCurrentUser.userId);
    });
  });
});

