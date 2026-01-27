import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsString({ message: '메시지 내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '메시지 내용은 필수입니다.' })
  @MinLength(1, { message: '메시지 내용은 최소 1자 이상이어야 합니다.' })
  content: string;

  @IsString({ message: '채널 ID는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '채널 ID는 필수입니다.' })
  channelId: string;
}
