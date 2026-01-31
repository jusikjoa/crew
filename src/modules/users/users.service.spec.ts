import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse: UserResponseDto = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('사용자를 성공적으로 생성해야 함', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue(null); // 이메일, 표시명 중복 없음
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(
        createUserDto.email,
        createUserDto.password,
        createUserDto.username,
        createUserDto.displayName,
      );

      expect(result).toEqual(mockUserResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { displayName: createUserDto.displayName } });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('이미 존재하는 이메일로 사용자 생성 시 ConflictException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create('test@example.com', 'password123', 'testuser'),
      ).rejects.toThrow(ConflictException);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('이미 사용 중인 표시명으로 사용자 생성 시 ConflictException을 던져야 함', async () => {
      mockRepository.findOne.mockImplementation(({ where }) => {
        if (where.email) return Promise.resolve(null); // 이메일 중복 없음
        if (where.displayName) return Promise.resolve(mockUser); // 표시명 중복 있음
        return Promise.resolve(null);
      });

      const createPromise = service.create('new@example.com', 'password123', 'newuser', 'Test User');
      await expect(createPromise).rejects.toThrow(ConflictException);
      await expect(createPromise).rejects.toThrow('이미 사용 중인 표시명입니다.');

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('ID로 사용자를 조회해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('존재하지 않는 사용자 조회 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneForResponse', () => {
    it('ID로 사용자를 조회하고 비밀번호를 제외한 정보를 반환해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneForResponse('1');

      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('존재하지 않는 사용자 조회 시 NotFoundException을 던져야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForResponse('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 조회해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('존재하지 않는 이메일 조회 시 null을 반환해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('사용자명으로 사용자를 조회해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    });

    it('존재하지 않는 사용자명 조회 시 null을 반환해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('notfounduser');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('모든 사용자를 조회해야 함', async () => {
      const users = [mockUser];
      const expectedUsers = [mockUserResponse];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('사용자 프로필을 업데이트해야 함', async () => {
      const updateData = { displayName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };
      const expectedResponse = { ...mockUserResponse, ...updateData };

      mockRepository.findOne.mockResolvedValueOnce(mockUser); // findOne(id)
      mockRepository.findOne.mockResolvedValueOnce(null); // findByDisplayName - 중복 없음
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateData);

      expect(result).toEqual(expectedResponse);
      expect(result.displayName).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('이메일 변경 시 중복 체크를 해야 함', async () => {
      const updateData = { email: 'newemail@example.com' };
      const originalUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedUser = { ...originalUser, ...updateData };
      const expectedResponse = {
        id: '1',
        email: 'newemail@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        createdAt: originalUser.createdAt,
        updatedAt: originalUser.updatedAt,
      };
      
      mockRepository.findOne.mockResolvedValueOnce(originalUser); // findOne 호출
      mockRepository.findOne.mockResolvedValueOnce(null); // findByEmail 호출 (중복 없음)
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateData);

      expect(result).toEqual(expectedResponse);
      expect(result.email).toBe('newemail@example.com');
    });

    it('중복된 이메일로 변경 시 ConflictException을 던져야 함', async () => {
      const updateData = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: '2', email: 'existing@example.com' };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(existingUser); // 중복 이메일 발견

      await expect(service.update('1', updateData)).rejects.toThrow(ConflictException);
    });

    it('중복된 표시명으로 변경 시 ConflictException을 던져야 함', async () => {
      const updateData = { displayName: 'Existing Display Name' };
      const existingUserWithDisplayName = { ...mockUser, id: '2', displayName: 'Existing Display Name' };

      mockRepository.findOne.mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(mockUser); // findOne(id)
        if (where.displayName) return Promise.resolve(existingUserWithDisplayName); // findByDisplayName
        return Promise.resolve(null);
      });

      await expect(service.update('1', updateData)).rejects.toThrow(ConflictException);
      await expect(service.update('1', updateData)).rejects.toThrow('이미 사용 중인 표시명입니다.');
    });
  });

  describe('updatePassword', () => {
    it('비밀번호를 업데이트해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, password: 'newPassword' });

      await service.updatePassword('1', 'newPassword');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('사용자를 활성화해야 함', async () => {
      const inactiveUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser',
        displayName: 'Test User',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const activatedUser = { ...inactiveUser, isActive: true };
      const expectedResponse = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        createdAt: inactiveUser.createdAt,
        updatedAt: inactiveUser.updatedAt,
      };
      
      mockRepository.findOne.mockResolvedValue(inactiveUser);
      mockRepository.save.mockResolvedValue(activatedUser);

      const result = await service.activate('1');

      expect(result).toEqual(expectedResponse);
      expect(result.isActive).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('사용자를 비활성화해야 함', async () => {
      const originalUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const deactivatedUser = { ...originalUser, isActive: false };
      const expectedResponse = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isActive: false,
        createdAt: originalUser.createdAt,
        updatedAt: originalUser.updatedAt,
      };
      
      mockRepository.findOne.mockResolvedValue(originalUser);
      mockRepository.save.mockResolvedValue(deactivatedUser);

      const result = await service.deactivate('1');

      expect(result).toEqual(expectedResponse);
      expect(result.isActive).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('사용자를 삭제해야 함', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.remove('1');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });
  });
});