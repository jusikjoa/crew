import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 회원가입
   * @param signupDto 회원가입 정보
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async signup(signupDto: SignupDto): Promise<UserResponseDto> {
    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    // 사용자 생성 (UsersService의 create 메서드는 이메일 중복 체크를 함)
    try {
      const user = await this.usersService.create(
        signupDto.email,
        hashedPassword,
        signupDto.username,
        signupDto.displayName,
      );
      return user;
    } catch (error) {
      // 이메일 중복 에러를 그대로 전달
      throw error;
    }
  }

  /**
   * 로그인
   * @param loginDto 로그인 정보 (이메일 또는 사용자명, 비밀번호)
   * @returns 사용자 정보와 Access 토큰
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // 이메일 또는 사용자명으로 사용자 찾기
    const user: User | null =
      (await this.usersService.findByEmail(loginDto.emailOrUsername)) ||
      (await this.usersService.findByUsername(loginDto.emailOrUsername));

    if (!user) {
      throw new UnauthorizedException('이메일/사용자명 또는 비밀번호가 올바르지 않습니다.');
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다. 관리자에게 문의하세요.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일/사용자명 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호를 제외한 사용자 정보
    const { password, ...userWithoutPassword } = user;
    const userResponse = userWithoutPassword as UserResponseDto;

    // JWT Access 토큰 생성
    const payload = { sub: user.id, email: user.email, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: userResponse,
      accessToken,
    };
  }
}

