import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
export class EmailService extends MailService {}

export { MailService };
