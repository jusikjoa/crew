import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { User } from '../users/entities/userEntity';
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

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    repository = module.get<Repository<Channel>>(getRepositoryToken(Channel));
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUserRepository.findOne.mockClear();
    mockUserRepository.save.mockClear();
  });

  describe('create', () => {
    const createChannelDto: CreateChannelDto = {
      name: 'general',
      description: '일반 채널',
      isPublic: true,
    };

    it('채널을 성공적으로 생성해야 함', async () => {
      const mockCreator = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        channels: [],
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // 채널명 중복 확인
        .mockResolvedValueOnce(null); // 채널 조회 (members 관계 로드용)
      mockRepository.create.mockReturnValue(mockChannel);
      mockRepository.save
        .mockResolvedValueOnce(mockChannel) // 채널 저장
        .mockResolvedValueOnce({ ...mockChannel, members: [mockCreator] }); // 멤버 추가 후 저장
      mockUserRepository.findOne.mockResolvedValue(mockCreator);

      const result = await service.create(createChannelDto, 'user-1');

      expect(result).toEqual(mockChannelResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createChannelDto.name },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['channels'],
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(2); // 채널 저장 + 멤버 추가 후 저장
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
      expect(mockUserRepository.findOne).not.toHaveBeenCalled(); // createdBy가 없으면 사용자 조회하지 않음
      expect(mockRepository.save).toHaveBeenCalledTimes(1); // 채널 저장만
    });

    it('description 없이 채널을 생성할 수 있어야 함', async () => {
      const createDtoWithoutDescription: CreateChannelDto = {
        name: 'general',
        isPublic: true,
      };
      const channelWithoutDescription = { ...mockChannel, description: null };
      const expectedResponse = { ...mockChannelResponse, description: null };
      const mockCreator = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        channels: [],
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(channelWithoutDescription);
      mockRepository.save
        .mockResolvedValueOnce(channelWithoutDescription)
        .mockResolvedValueOnce({ ...channelWithoutDescription, members: [mockCreator] });
      mockUserRepository.findOne.mockResolvedValue(mockCreator);
      mockUserRepository.save.mockResolvedValue(mockCreator);

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

  describe('findUserChannels', () => {
    it('사용자가 참여한 채널 목록을 조회해야 함', async () => {
      const testChannel: Channel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: undefined,
      };

      const testChannelResponse: ChannelResponseDto = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: testChannel.createdAt,
        updatedAt: testChannel.updatedAt,
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [testChannel],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserChannels('user-1');

      expect(result).toEqual([testChannelResponse]);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['channels'],
      });
    });

    it('참여한 채널이 없을 때 빈 배열을 반환해야 함', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserChannels('user-1');

      expect(result).toEqual([]);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['channels'],
      });
    });

    it('존재하지 않는 사용자 조회 시 NotFoundException을 던져야 함', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findUserChannels('999')).rejects.toThrow(NotFoundException);
      await expect(service.findUserChannels('999')).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });

    it('여러 채널에 참여한 경우 모두 반환해야 함', async () => {
      const testChannel1: Channel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: undefined,
      };

      const testChannel2: Channel = {
        id: '2',
        name: 'random',
        description: '랜덤 채널',
        isPublic: true,
        createdBy: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: undefined,
      };

      const testChannel1Response: ChannelResponseDto = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: testChannel1.createdAt,
        updatedAt: testChannel1.updatedAt,
      };

      const testChannel2Response: ChannelResponseDto = {
        id: '2',
        name: 'random',
        description: '랜덤 채널',
        isPublic: true,
        createdBy: 'user-2',
        createdAt: testChannel2.createdAt,
        updatedAt: testChannel2.updatedAt,
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [testChannel1, testChannel2],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserChannels('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('joinChannel', () => {
    it('채널에 성공적으로 참여해야 함', async () => {
      const testChannel: Channel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: undefined,
      };

      const testChannelResponse: ChannelResponseDto = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: testChannel.createdAt,
        updatedAt: testChannel.updatedAt,
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const channelWithoutMembers = { ...testChannel, members: [] };
      const channelWithMember = { ...testChannel, members: [mockUser] };

      mockRepository.findOne.mockResolvedValue(channelWithoutMembers);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(channelWithMember);

      const result = await service.joinChannel('1', 'user-1');

      expect(result).toEqual(testChannelResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['members'],
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 채널 참여 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.joinChannel('999', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.joinChannel('999', 'user-1')).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자가 참여 시 NotFoundException을 던져야 함', async () => {
      const channelWithoutMembers = { ...mockChannel, members: [] };
      mockRepository.findOne.mockResolvedValue(channelWithoutMembers);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.joinChannel('1', '999')).rejects.toThrow(NotFoundException);
      await expect(service.joinChannel('1', '999')).rejects.toThrow('사용자를 찾을 수 없습니다.');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('이미 참여 중인 채널에 참여 시 ConflictException을 던져야 함', async () => {
      const testChannel: Channel = {
        id: '1',
        name: 'general',
        description: '일반 채널',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: undefined,
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const channelWithMember = { ...testChannel, members: [mockUser] };
      mockRepository.findOne.mockResolvedValue(channelWithMember);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.joinChannel('1', 'user-1')).rejects.toThrow(ConflictException);
      await expect(service.joinChannel('1', 'user-1')).rejects.toThrow('이미 참여 중인 채널입니다.');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('leaveChannel', () => {
    it('채널에서 성공적으로 탈퇴해야 함', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const channelWithMember = { ...mockChannel, members: [mockUser] };
      const channelWithoutMember = { ...mockChannel, members: [] };

      mockRepository.findOne.mockResolvedValue(channelWithMember);
      mockRepository.save.mockResolvedValue(channelWithoutMember);

      await service.leaveChannel('1', 'user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['members'],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [],
        }),
      );
    });

    it('존재하지 않는 채널 탈퇴 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.leaveChannel('999', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.leaveChannel('999', 'user-1')).rejects.toThrow('채널을 찾을 수 없습니다.');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('참여하지 않은 채널 탈퇴 시 BadRequestException을 던져야 함', async () => {
      const channelWithoutMembers = { ...mockChannel, members: [] };
      mockRepository.findOne.mockResolvedValue(channelWithoutMembers);

      await expect(service.leaveChannel('1', 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.leaveChannel('1', 'user-1')).rejects.toThrow('참여하지 않은 채널입니다.');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('다른 사용자가 참여한 채널에서 탈퇴 시 BadRequestException을 던져야 함', async () => {
      const otherUser: User = {
        id: 'user-2',
        email: 'other@example.com',
        password: 'hashed',
        username: 'otheruser',
        displayName: 'Other User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const channelWithOtherUser = { ...mockChannel, members: [otherUser] };
      mockRepository.findOne.mockResolvedValue(channelWithOtherUser);

      await expect(service.leaveChannel('1', 'user-1')).rejects.toThrow(BadRequestException);
      await expect(service.leaveChannel('1', 'user-1')).rejects.toThrow('참여하지 않은 채널입니다.');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('여러 멤버가 있는 채널에서 탈퇴해도 다른 멤버는 유지되어야 함', async () => {
      const mockUser1: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser2: User = {
        id: 'user-2',
        email: 'test2@example.com',
        password: 'hashed',
        username: 'testuser2',
        displayName: 'Test User 2',
        isActive: true,
        channels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const channelWithMembers = { ...mockChannel, members: [mockUser1, mockUser2] };
      const channelWithOneMember = { ...mockChannel, members: [mockUser2] };

      mockRepository.findOne.mockResolvedValue(channelWithMembers);
      mockRepository.save.mockResolvedValue(channelWithOneMember);

      await service.leaveChannel('1', 'user-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [mockUser2], // user-2만 남아있어야 함
        }),
      );
    });
  });
});

