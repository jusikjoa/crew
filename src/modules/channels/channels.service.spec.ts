import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let repository: Repository<Channel>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockChannel: Channel = {
    id: '1',
    name: 'general',
    description: '일반 채널',
    isPublic: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: undefined,
  };

  const mockChannelResponse: ChannelResponseDto = {
    id: '1',
    name: 'general',
    description: '일반 채널',
    isPublic: true,
    createdBy: 'user-1',
    createdAt: mockChannel.createdAt,
    updatedAt: mockChannel.updatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: getRepositoryToken(Channel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    repository = module.get<Repository<Channel>>(getRepositoryToken(Channel));
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
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockChannel);
      mockRepository.save.mockResolvedValue(mockChannel);

      const result = await service.create(createChannelDto, 'user-1');

      expect(result).toEqual(mockChannelResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createChannelDto.name },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('createdBy 없이 채널을 생성할 수 있어야 함', async () => {
      const channelWithoutCreator = { ...mockChannel, createdBy: null };
      const expectedResponse = { ...mockChannelResponse, createdBy: null };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(channelWithoutCreator);
      mockRepository.save.mockResolvedValue(channelWithoutCreator);

      const result = await service.create(createChannelDto);

      expect(result).toEqual(expectedResponse);
      expect(result.createdBy).toBeNull();
    });

    it('description 없이 채널을 생성할 수 있어야 함', async () => {
      const createDtoWithoutDescription: CreateChannelDto = {
        name: 'general',
        isPublic: true,
      };
      const channelWithoutDescription = { ...mockChannel, description: null };
      const expectedResponse = { ...mockChannelResponse, description: null };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(channelWithoutDescription);
      mockRepository.save.mockResolvedValue(channelWithoutDescription);

      const result = await service.create(createDtoWithoutDescription, 'user-1');

      expect(result).toEqual(expectedResponse);
    });

    it('isPublic 기본값이 true여야 함', async () => {
      const createDtoWithoutIsPublic: CreateChannelDto = {
        name: 'general',
      };
      const channel = { ...mockChannel, isPublic: true };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(channel);
      mockRepository.save.mockResolvedValue(channel);

      await service.create(createDtoWithoutIsPublic, 'user-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: true }),
      );
    });

    it('이미 존재하는 채널명으로 생성 시 ConflictException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockChannel);

      await expect(service.create(createChannelDto, 'user-1')).rejects.toThrow(ConflictException);
      await expect(service.create(createChannelDto, 'user-1')).rejects.toThrow(
        '이미 존재하는 채널 이름입니다.',
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('모든 채널을 조회해야 함', async () => {
      const channels = [mockChannel];
      const expectedChannels = [mockChannelResponse];
      mockRepository.find.mockResolvedValue(channels);

      const result = await service.findAll();

      expect(result).toEqual(expectedChannels);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('채널이 없을 때 빈 배열을 반환해야 함', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('ID로 채널을 조회해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockChannel);

      const result = await service.findOne('1');

      expect(result).toEqual(mockChannelResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('존재하지 않는 채널 조회 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('채널을 찾을 수 없습니다.');
    });
  });

  describe('update', () => {
    const updateChannelDto: UpdateChannelDto = {
      name: 'updated-channel',
      description: '업데이트된 설명',
      isPublic: false,
    };

    it('채널을 성공적으로 업데이트해야 함', async () => {
      const updatedChannel = { ...mockChannel, ...updateChannelDto };
      const expectedResponse = { ...mockChannelResponse, ...updateChannelDto };

      mockRepository.findOne.mockResolvedValueOnce(mockChannel); // 채널 조회
      mockRepository.findOne.mockResolvedValueOnce(null); // 이름 중복 체크
      mockRepository.save.mockResolvedValue(updatedChannel);

      const result = await service.update('1', updateChannelDto, 'user-1');

      expect(result).toEqual(expectedResponse);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('일부 필드만 업데이트할 수 있어야 함', async () => {
      const originalChannel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const partialUpdateDto: UpdateChannelDto = {
        description: '새로운 설명',
      };
      const updatedChannel = { ...originalChannel, description: '새로운 설명' };
      const expectedResponse = {
        id: '1',
        name: 'general',
        description: '새로운 설명',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: originalChannel.createdAt,
        updatedAt: originalChannel.updatedAt,
      };

      mockRepository.findOne.mockResolvedValue(originalChannel);
      mockRepository.save.mockResolvedValue(updatedChannel);

      const result = await service.update('1', partialUpdateDto, 'user-1');

      expect(result).toEqual(expectedResponse);
    });

    it('존재하지 않는 채널 업데이트 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', updateChannelDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('999', updateChannelDto, 'user-1')).rejects.toThrow(
        '채널을 찾을 수 없습니다.',
      );
    });

    it('권한이 없는 사용자가 업데이트 시 ForbiddenException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockChannel);

      await expect(service.update('1', updateChannelDto, 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update('1', updateChannelDto, 'user-2')).rejects.toThrow(
        '채널을 수정할 권한이 없습니다.',
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('이름 변경 시 중복 확인을 해야 함', async () => {
      const nameUpdateDto: UpdateChannelDto = {
        name: 'new-name',
      };
      const existingChannelWithNewName = { ...mockChannel, id: '2', name: 'new-name' };

      mockRepository.findOne.mockResolvedValueOnce(mockChannel); // 채널 조회
      mockRepository.findOne.mockResolvedValueOnce(existingChannelWithNewName); // 중복 이름 발견

      await expect(service.update('1', nameUpdateDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('1', nameUpdateDto, 'user-1')).rejects.toThrow(
        '이미 존재하는 채널 이름입니다.',
      );
    });

    it('같은 이름으로 변경 시 중복 체크를 하지 않아야 함', async () => {
      const originalChannel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const sameNameUpdateDto: UpdateChannelDto = {
        name: 'general', // 기존 이름과 동일
        description: '업데이트된 설명',
      };
      const updatedChannel = { ...originalChannel, description: '업데이트된 설명' };

      mockRepository.findOne.mockResolvedValue(originalChannel);
      mockRepository.save.mockResolvedValue(updatedChannel);

      const result = await service.update('1', sameNameUpdateDto, 'user-1');

      // 채널 조회만 호출되고, 이름 중복 체크(findOne)는 호출되지 않음
      // (이름이 같으면 중복 체크 로직을 건너뛰기 때문)
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1); // 채널 조회만
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.description).toBe('업데이트된 설명');
      expect(result.name).toBe('general'); // 이름은 변경되지 않음
    });
  });

  describe('remove', () => {
    it('채널을 성공적으로 삭제해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockChannel);
      mockRepository.remove.mockResolvedValue(mockChannel);

      await service.remove('1', 'user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockChannel);
    });

    it('존재하지 않는 채널 삭제 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.remove('999', 'user-1')).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('권한이 없는 사용자가 삭제 시 ForbiddenException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockChannel);

      await expect(service.remove('1', 'user-2')).rejects.toThrow(ForbiddenException);
      await expect(service.remove('1', 'user-2')).rejects.toThrow(
        '채널을 삭제할 권한이 없습니다.',
      );

      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});

