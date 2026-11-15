import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const message = exception instanceof WsException || exception instanceof Error
      ? exception.message
      : 'Unexpected error';

    client.emit('error', { message });
  }
}
