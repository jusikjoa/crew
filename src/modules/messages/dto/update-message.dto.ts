import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString({ message: '메시지 내용은 문자열이어야 합니다.' })
  @MinLength(1, { message: '메시지 내용은 최소 1자 이상이어야 합니다.' })
  content?: string;
}
