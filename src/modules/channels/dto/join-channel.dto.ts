import { IsString, MinLength, IsOptional } from 'class-validator';

export class JoinChannelDto {
  @IsOptional()
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
  password?: string;
}
