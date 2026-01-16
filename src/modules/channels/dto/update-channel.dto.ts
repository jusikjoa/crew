import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString({ message: '채널 이름은 문자열이어야 합니다.' })
  @MinLength(1, { message: '채널 이름은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '채널 이름은 100자 이하여야 합니다.' })
  name?: string;

  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @MaxLength(500, { message: '설명은 500자 이하여야 합니다.' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: '공개 여부는 boolean이어야 합니다.' })
  isPublic?: boolean;

  @IsOptional()
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
  @MaxLength(100, { message: '비밀번호는 100자 이하여야 합니다.' })
  password?: string;
}

