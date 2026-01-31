import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// bcrypt 모킹
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  // 날짜를 고정하여 테스트 간 일관성 유지
  const fixedDate = new Date('2026-01-10T10:46:10.610Z');

  const mockUserResponse: UserResponseDto = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
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
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await service.signup(signupDto);

      expect(result).toEqual(mockUserResponse);
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

    it('이미 존재하는 이메일로 회원가입 시 ConflictException을 던져야 함', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockRejectedValue(
        new ConflictException('이미 존재하는 이메일입니다.'),
      );

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(signupDto)).rejects.toThrow('이미 존재하는 이메일입니다.');

      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('비밀번호를 올바르게 해싱해야 함', async () => {
      const hashedPassword = 'hashedPassword123';
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

  describe('login', () => {
    const loginDto: LoginDto = {
      emailOrUsername: 'test@example.com',
      password: 'Password123',
    };

    it('로그인에 성공해야 함', async () => {
      const accessToken = 'mock-access-token';
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: mockUserResponse,
        accessToken,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.emailOrUsername);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('사용자명으로 로그인에 성공해야 함', async () => {
      const loginDtoWithUsername: LoginDto = {
        emailOrUsername: 'testuser',
        password: 'Password123',
      };
      const accessToken = 'mock-access-token';
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDtoWithUsername);

      expect(result).toEqual({
        user: mockUserResponse,
        accessToken,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDtoWithUsername.emailOrUsername);
      expect(usersService.findByUsername).toHaveBeenCalledWith(loginDtoWithUsername.emailOrUsername);
    });

    it('존재하지 않는 사용자로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(
        '이메일/사용자명 또는 비밀번호가 올바르지 않습니다.',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.emailOrUsername);
      expect(usersService.findByUsername).toHaveBeenCalledWith(loginDto.emailOrUsername);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('비활성화된 계정으로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('비활성화된 계정입니다. 관리자에게 문의하세요.');

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.emailOrUsername);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(
        '이메일/사용자명 또는 비밀번호가 올바르지 않습니다.',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.emailOrUsername);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});

