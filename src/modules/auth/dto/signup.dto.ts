import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(100, { message: '비밀번호는 100자 이하여야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  @MaxLength(30, { message: '사용자명은 30자 이하여야 합니다.' })
  @Matches(/^[a-zA-Z0-9_가-힣]+$/, {
    message: '사용자명은 영문, 숫자, 언더스코어(_), 한글만 사용할 수 있습니다.',
  })
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '표시명은 50자 이하여야 합니다.' })
  @Matches(/^[\p{L}\p{N}\p{Zs}_\-.,()가-힣]*$/u, {
    message: '표시명에는 영문, 한글, 숫자, 공백, 일부 특수문자(_, -, ., ,, (, ))만 사용할 수 있습니다.',
  })
  displayName?: string;
}

