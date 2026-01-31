import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
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
      mockAuthService.signup.mockResolvedValue(mockUserResponse);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(mockUserResponse);
      expect(service.signup).toHaveBeenCalledWith(signupDto);
      expect(service.signup).toHaveBeenCalledTimes(1);
    });

    it('displayName 없이 회원가입에 성공해야 함', async () => {
      const signupDtoWithoutDisplayName: SignupDto = {
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
      };
      const userWithoutDisplayName = { ...mockUserResponse, displayName: null };

      mockAuthService.signup.mockResolvedValue(userWithoutDisplayName);

      const result = await controller.signup(signupDtoWithoutDisplayName);

      expect(result).toEqual(userWithoutDisplayName);
      expect(service.signup).toHaveBeenCalledWith(signupDtoWithoutDisplayName);
    });

    it('이미 존재하는 이메일로 회원가입 시 ConflictException을 던져야 함', async () => {
      mockAuthService.signup.mockRejectedValue(
        new ConflictException('이미 존재하는 이메일입니다.'),
      );

      await expect(controller.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(controller.signup(signupDto)).rejects.toThrow('이미 존재하는 이메일입니다.');

      expect(service.signup).toHaveBeenCalledWith(signupDto);
    });

    it('응답에 비밀번호가 포함되지 않아야 함', async () => {
      mockAuthService.signup.mockResolvedValue(mockUserResponse);

      const result = await controller.signup(signupDto);

      expect(result).not.toHaveProperty('password');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      emailOrUsername: 'test@example.com',
      password: 'Password123',
    };

    const mockLoginResponse: LoginResponseDto = {
      user: mockUserResponse,
      accessToken: 'mock-access-token',
    };

    it('로그인에 성공해야 함', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(result.user).toEqual(mockUserResponse);
      expect(result.accessToken).toBe('mock-access-token');
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 사용자로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('이메일/사용자명 또는 비밀번호가 올바르지 않습니다.'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow(
        '이메일/사용자명 또는 비밀번호가 올바르지 않습니다.',
      );

      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('비활성화된 계정으로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('비활성화된 계정입니다. 관리자에게 문의하세요.'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('비활성화된 계정입니다. 관리자에게 문의하세요.');

      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('응답에 사용자 정보와 토큰이 포함되어야 함', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user).not.toHaveProperty('password');
      expect(typeof result.accessToken).toBe('string');
    });
  });
});

