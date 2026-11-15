import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

function extractToken(client: Socket): string | null {
  const authHeader = client.handshake.auth?.token ?? client.handshake.headers?.authorization;
  if (!authHeader) return null;
  const trimmed = authHeader.trim();
  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = extractToken(client);
    if (!token) {
      this.logger.debug(`Anonymous client connected: ${client.id}`);
      return;
    }

    try {
      const payload: any = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
      });
      const userId = (payload.sub || payload.userId || payload.id)?.toString();
      if (!userId) return;

      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join a user-specific room for reliable multicasting
      void client.join(`user:${userId}`);
      this.logger.log(`Authenticated user ${userId} connected to notification socket ${client.id}`);
    } catch (err: any) {
      this.logger.debug(`Socket authentication failed for client ${client.id}: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
      this.logger.log(`User ${userId} disconnected notification socket ${client.id}`);
    }
  }

  /**
   * Emits a real-time event to all active sockets belonging to a specific user.
   */
  emitToUser(userId: string, event: string, payload: any): void {
    if (!this.server) {
      this.logger.warn('Socket server is not initialized yet.');
      return;
    }

    const room = `user:${userId.toString()}`;
    this.server.to(room).emit(event, payload);
    this.logger.log(`Emitted '${event}' to ${room}`);
  }
}

