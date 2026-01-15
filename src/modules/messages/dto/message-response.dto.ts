import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ChannelResponseDto } from '../../channels/dto/channel-response.dto';

export class MessageResponseDto {
  id: string;
  content: string;
  authorId: string;
  author?: UserResponseDto;
  channelId: string;
  channel?: ChannelResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
