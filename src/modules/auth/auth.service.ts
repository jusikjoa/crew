import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 회원가입
   * @param signupDto 회원가입 정보
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async signup(signupDto: SignupDto): Promise<UserResponseDto> {
    // 사용자명 중복 확인
    const existingUserByUsername = await this.usersService.findByUsername(signupDto.username);
    if (existingUserByUsername) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

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
}

