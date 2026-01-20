import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessageResponseDto } from './dto/message-response.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // 프로덕션에서는 특정 도메인으로 제한
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set<channelId>

  constructor(
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // JWT 토큰 인증
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });

      client.userId = payload.sub;
      client.email = payload.email;
      client.username = payload.username;

      console.log(`Client connected: ${client.userId}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // 사용자가 참여한 모든 채널에서 제거
      const channels = this.userRooms.get(client.userId);
      if (channels) {
        channels.forEach((channelId) => {
          client.leave(`channel:${channelId}`);
        });
        this.userRooms.delete(client.userId);
      }
      console.log(`Client disconnected: ${client.userId}`);
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // 쿼리 파라미터에서 토큰 추출
    const token = client.handshake.query?.token as string;
    if (token) {
      return token;
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * 채널에 참여 (구독)
   */
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: '인증이 필요합니다.' });
      return;
    }

    try {
      // 채널 멤버 확인은 클라이언트 측에서 처리하고, 여기서는 룸 조인만 수행
      const { channelId } = data;
      const roomName = `channel:${channelId}`;

      await client.join(roomName);

      // 사용자별 채널 목록 관리
      if (!this.userRooms.has(client.userId)) {
        this.userRooms.set(client.userId, new Set());
      }
      this.userRooms.get(client.userId)?.add(channelId);

      client.emit('joinedChannel', { channelId });
      console.log(`User ${client.userId} joined channel ${channelId}`);
    } catch (error) {
      client.emit('error', { message: '채널 참여 실패', error: error.message });
    }
  }

  /**
   * 채널에서 나가기 (구독 해제)
   */
  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) {
      return;
    }

    const { channelId } = data;
    const roomName = `channel:${channelId}`;

    await client.leave(roomName);

    // 사용자별 채널 목록에서 제거
    const channels = this.userRooms.get(client.userId);
    if (channels) {
      channels.delete(channelId);
      if (channels.size === 0) {
        this.userRooms.delete(client.userId);
      }
    }

    client.emit('leftChannel', { channelId });
    console.log(`User ${client.userId} left channel ${channelId}`);
  }

  /**
   * 새 메시지가 생성되었을 때 해당 채널의 모든 클라이언트에 브로드캐스트
   */
  broadcastNewMessage(channelId: string, message: MessageResponseDto) {
    this.server.to(`channel:${channelId}`).emit('newMessage', message);
    console.log(`Broadcasted new message to channel ${channelId}`);
  }

  /**
   * 메시지가 삭제되었을 때 해당 채널의 모든 클라이언트에 브로드캐스트
   */
  broadcastDeletedMessage(channelId: string, messageId: string) {
    this.server.to(`channel:${channelId}`).emit('deletedMessage', { messageId, channelId });
    console.log(`Broadcasted deleted message ${messageId} to channel ${channelId}`);
  }
}
