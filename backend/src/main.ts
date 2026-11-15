import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  // Specifically configure express.raw for payment webhook signature verification
  app.use(
    '/payments/webhook',
    express.raw({ type: 'application/json' }),
    (req: any, _res: any, next: any) => {
      if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body;
      }
      next();
    },
  );

  app.useBodyParser('json', {
    limit: '50mb',
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  });
  app.useBodyParser('urlencoded', { extended: true, limit: '50mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigin =
    configService.get<string>('FRONTEND_URL') ||
    configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

  app.enableCors({
    origin: allowedOrigin.includes(',')
      ? allowedOrigin.split(',').map((s) => s.trim())
      : allowedOrigin,
    credentials: true,
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
}

bootstrap();
