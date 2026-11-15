import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Email transporter initialized for host: ${host}`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully provided (SMTP_HOST, SMTP_USER, SMTP_PASS). Email alerts will be logged to console.',
      );
    }
  }

  /**
   * Sends an email alert to a bounty question author when someone answers.
   */
  async sendBountyAlert(
    userEmail: string,
    postTitle: string,
    bountyAmount: number,
    answerAuthor: string = 'A contributor',
  ): Promise<boolean> {
    if (!userEmail) {
      this.logger.warn('Cannot send bounty alert: userEmail is missing.');
      return false;
    }

    const subject = `💰 New Answer on your Bounty Question: "${postTitle.slice(0, 40)}..."`;
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@nexus-dev.com';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; padding: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #f43f5e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Nexus</h2>
          <span style="margin-left: 8px; color: #a1a1aa; font-size: 13px;">• Verified Knowledge Network</span>
        </div>

        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; padding: 4px 10px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
            💰 ${bountyAmount} cr Bounty Alert
          </div>
          <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 8px; font-size: 16px;">
            ${answerAuthor} just submitted an answer to your bounty question!
          </h3>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0; line-height: 1.5;">
            "${postTitle}"
          </p>
        </div>

        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6;">
          Review their solution. If it solves your problem, you can accept their answer to award the <strong>${bountyAmount} credits</strong> and mark the bounty as claimed.
        </p>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:5173" style="display: inline-block; background-color: #e11d48; color: #ffffff; font-weight: bold; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px;">
            View Solution on Nexus
          </a>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          You received this email because you posted an active bounty on Nexus.
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"Nexus Bounties" <${fromAddress}>`,
          to: userEmail,
          subject,
          html,
        });
        this.logger.log(`Bounty alert email successfully sent to ${userEmail}`);
      } else {
        this.logger.log(`[Dev Email Simulation] Bounty Alert to ${userEmail}:`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Bounty: ${bountyAmount} cr on post "${postTitle}" by ${answerAuthor}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send bounty alert email to ${userEmail}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends an email alert to a targeted expert requesting their expertise for an exclusive bounty.
   */
  async sendTargetedBountyRequest(
    userEmail: string,
    postTitle: string,
    bountyAmount: number,
    authorUsername: string = 'A creator',
  ): Promise<boolean> {
    if (!userEmail) {
      this.logger.warn('Cannot send targeted bounty request: userEmail is missing.');
      return false;
    }

    const subject = `You have been requested for a ${bountyAmount} cr bounty on Nexus`;
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@nexus-dev.com';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; padding: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #f43f5e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Nexus</h2>
          <span style="margin-left: 8px; color: #a1a1aa; font-size: 13px;">• Targeted Expert Request</span>
        </div>

        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; padding: 4px 10px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
            🔒 24-Hour Exclusive Bounty Lock (${bountyAmount} cr)
          </div>
          <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 8px; font-size: 16px;">
            ${authorUsername} has personally requested your verified expertise!
          </h3>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0; line-height: 1.5;">
            "${postTitle}"
          </p>
        </div>

        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          This discussion is exclusively locked for you for the next 24 hours. Submit your solution before the lock expires to claim the <strong>${bountyAmount} credits</strong> escrow.
        </p>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:5173" style="display: inline-block; background-color: #e11d48; color: #ffffff; font-weight: bold; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px;">
            Answer & Claim Bounty
          </a>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          You received this email because you were chosen as a targeted expert on Nexus.
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"Nexus Bounties" <${fromAddress}>`,
          to: userEmail,
          subject,
          html,
        });
        this.logger.log(`Targeted bounty email successfully sent to ${userEmail}`);
      } else {
        this.logger.log(`[Dev Email Simulation] Targeted Bounty to ${userEmail}:`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Post: "${postTitle}" | Bounty: ${bountyAmount} cr | Author: ${authorUsername}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send targeted bounty email to ${userEmail}: ${error.message}`);
      return false;
    }
  }
}

