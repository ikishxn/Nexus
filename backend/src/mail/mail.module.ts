import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, EmailService],
  exports: [MailService, EmailService],
})
export class MailModule {}
