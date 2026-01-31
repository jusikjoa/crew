import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_가-힣]+$/, {
    message: '사용자명은 영문, 숫자, 언더스코어(_), 한글만 사용할 수 있습니다.',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[\p{L}\p{N}\p{Zs}_\-.,()가-힣]*$/u, {
    message: '표시명에는 영문, 한글, 숫자, 공백, 일부 특수문자(_, -, ., ,, (, ))만 사용할 수 있습니다.',
  })
  displayName?: string;
}