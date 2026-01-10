export class ChannelResponseDto {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

