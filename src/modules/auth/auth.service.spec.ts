import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

// bcrypt 모킹
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockUserResponse: UserResponseDto = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password123',
      username: 'testuser',
      displayName: 'Test User',
    };

    it('회원가입에 성공해야 함', async () => {
      const hashedPassword = 'hashedPassword123';
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await service.signup(signupDto);

      expect(result).toEqual(mockUserResponse);
      expect(usersService.findByUsername).toHaveBeenCalledWith(signupDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith(
        signupDto.email,
        hashedPassword,
        signupDto.username,
        signupDto.displayName,
      );
    });

    it('displayName 없이 회원가입에 성공해야 함', async () => {
      const signupDtoWithoutDisplayName: SignupDto = {
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
      };
      const hashedPassword = 'hashedPassword123';
      const userWithoutDisplayName = { ...mockUserResponse, displayName: null };

      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue(userWithoutDisplayName);

      const result = await service.signup(signupDtoWithoutDisplayName);

      expect(result).toEqual(userWithoutDisplayName);
      expect(usersService.create).toHaveBeenCalledWith(
        signupDtoWithoutDisplayName.email,
        hashedPassword,
        signupDtoWithoutDisplayName.username,
        undefined,
      );
    });

    it('이미 사용 중인 사용자명으로 회원가입 시 ConflictException을 던져야 함', async () => {
      const existingUser = {
        id: '2',
        email: 'existing@example.com',
        username: 'testuser',
        password: 'hashed',
        displayName: 'Existing User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByUsername.mockResolvedValue(existingUser);

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(signupDto)).rejects.toThrow('이미 사용 중인 사용자명입니다.');

      expect(usersService.findByUsername).toHaveBeenCalledWith(signupDto.username);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('이미 존재하는 이메일로 회원가입 시 ConflictException을 던져야 함', async () => {
      const hashedPassword = 'hashedPassword123';
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockRejectedValue(
        new ConflictException('이미 존재하는 이메일입니다.'),
      );

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(signupDto)).rejects.toThrow('이미 존재하는 이메일입니다.');

      expect(usersService.findByUsername).toHaveBeenCalledWith(signupDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('비밀번호를 올바르게 해싱해야 함', async () => {
      const hashedPassword = 'hashedPassword123';
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      await service.signup(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith(
        signupDto.email,
        hashedPassword,
        signupDto.username,
        signupDto.displayName,
      );
      expect(usersService.create).not.toHaveBeenCalledWith(
        expect.anything(),
        signupDto.password, // 원본 비밀번호가 아닌 해싱된 비밀번호가 전달되어야 함
        expect.anything(),
        expect.anything(),
      );
    });
  });
});

