import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString({ message: '이메일 또는 사용자명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이메일 또는 사용자명을 입력해주세요.' })
  emailOrUsername: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;
}

