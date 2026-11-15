import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsExceptionFilter } from './ws-exception.filter';
import { JoinContextRoomDto, SendMessageDto } from './dto/chat-events.dto';

interface AuthenticatedSocket extends Socket {
  data: {
    user: { userId: string; username: string; email: string };
  };
}

function roomNameFor(contextRef: string): string {
  return `context:${contextRef}`;
}

@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('joinContextRoom')
  handleJoinContextRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinContextRoomDto,
  ): { event: string; contextRef: string } {
    const room = roomNameFor(dto.contextRef);
    void client.join(room);

    client.to(room).emit('userJoined', {
      contextRef: dto.contextRef,
      username: client.data.user.username,
    });

    return { event: 'joinedContextRoom', contextRef: dto.contextRef };
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ): { event: string; contextRef: string } {
    const room = roomNameFor(dto.contextRef);

    const payload = {
      contextRef: dto.contextRef,
      body: dto.body,
      author: {
        userId: client.data.user.userId,
        username: client.data.user.username,
      },
      sentAt: new Date().toISOString(),
    };

    this.server.to(room).emit('newMessage', payload);

    return { event: 'messageSent', contextRef: dto.contextRef };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveContextRoom')
  handleLeaveContextRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinContextRoomDto,
  ): void {
    const room = roomNameFor(dto.contextRef);
    void client.leave(room);
    client.to(room).emit('userLeft', {
      contextRef: dto.contextRef,
      username: client.data.user.username,
    });
  }
}
