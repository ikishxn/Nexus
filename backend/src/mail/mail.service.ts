import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeResend();
  }

  private initializeResend() {
    const apiKey =
      this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email client initialized successfully (Port 443 HTTPS).');
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Outgoing emails will be logged to the console in dev mode.',
      );
    }
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('RESEND_FROM') ||
      process.env.RESEND_FROM ||
      'Nexus <onboarding@resend.dev>'
    );
  }

  /**
   * Sends a password reset email containing a secure 1-hour expiration link.
   */
  async sendPasswordResetEmail(
    userEmail: string,
    resetUrl: string,
    username: string = 'Developer',
  ): Promise<boolean> {
    if (!userEmail) return false;

    const subject = '🔒 Reset Your Nexus Password';
    const from = this.getFromAddress();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; padding: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #f43f5e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Nexus</h2>
          <span style="margin-left: 8px; color: #a1a1aa; font-size: 13px;">• Verified Knowledge Network</span>
        </div>

        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 8px; font-size: 16px;">
            Password Reset Request
          </h3>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0; line-height: 1.5;">
            Hi <strong>${username}</strong>, we received a request to reset your password on Nexus.
          </p>
        </div>

        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6;">
          Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.
        </p>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #e11d48; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);">
            Reset Password
          </a>
        </div>

        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #f43f5e; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
        </div>
      </div>
    `;

    try {
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to: userEmail,
          subject,
          html,
        });

        if (error) {
          this.logger.error(`Resend API failed to send password reset email to ${userEmail}: ${error.message}`);
          return false;
        }

        this.logger.log(`Password reset email successfully sent via Resend to ${userEmail} (ID: ${data?.id})`);
        return true;
      }

      this.logger.log(`[Dev Email Simulation] Password Reset to ${userEmail}: ${resetUrl}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${userEmail}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends an email verification link to a newly registered user.
   */
  async sendVerificationEmail(
    userEmail: string,
    verifyUrl: string,
    username: string = 'Developer',
  ): Promise<boolean> {
    if (!userEmail) return false;

    const subject = '✉️ Verify Your Nexus Account';
    const from = this.getFromAddress();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; padding: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #f43f5e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Nexus</h2>
          <span style="margin-left: 8px; color: #a1a1aa; font-size: 13px;">• Verified Knowledge Network</span>
        </div>

        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 8px; font-size: 16px;">
            Welcome to Nexus, ${username}!
          </h3>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0; line-height: 1.5;">
            Please verify your email address to activate your account and start contributing to peer-reviewed developer discussions.
          </p>
        </div>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #e11d48; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);">
            Verify Email Address
          </a>
        </div>

        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #f43f5e; word-break: break-all;">${verifyUrl}</a>
        </p>

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          Nexus • The Verified Knowledge Network for Developers
        </div>
      </div>
    `;

    try {
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to: userEmail,
          subject,
          html,
        });

        if (error) {
          this.logger.error(`Resend API failed to send verification email to ${userEmail}: ${error.message}`);
          return false;
        }

        this.logger.log(`Verification email successfully sent via Resend to ${userEmail} (ID: ${data?.id})`);
        return true;
      }

      this.logger.log(`[Dev Email Simulation] Email Verification to ${userEmail}: ${verifyUrl}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${userEmail}: ${error.message}`);
      return false;
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
    if (!userEmail) return false;

    const subject = `💰 New Answer on your Bounty Question: "${postTitle.slice(0, 40)}..."`;
    const from = this.getFromAddress();

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
          Review their solution. If it solves your problem, you can accept their answer to award the <strong>${bountyAmount} credits</strong>.
        </p>

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          You received this email because you posted an active bounty on Nexus.
        </div>
      </div>
    `;

    try {
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to: userEmail,
          subject,
          html,
        });

        if (error) {
          this.logger.error(`Resend API failed to send bounty alert to ${userEmail}: ${error.message}`);
          return false;
        }

        this.logger.log(`Bounty alert email successfully sent via Resend to ${userEmail} (ID: ${data?.id})`);
        return true;
      }

      this.logger.log(`[Dev Email Simulation] Bounty Alert to ${userEmail}: "${postTitle}" by ${answerAuthor}`);
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
    if (!userEmail) return false;

    const subject = `You have been requested for a ${bountyAmount} cr bounty on Nexus`;
    const from = this.getFromAddress();

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

        <div style="margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          You received this email because you were chosen as a targeted expert on Nexus.
        </div>
      </div>
    `;

    try {
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to: userEmail,
          subject,
          html,
        });

        if (error) {
          this.logger.error(`Resend API failed to send targeted bounty email to ${userEmail}: ${error.message}`);
          return false;
        }

        this.logger.log(`Targeted bounty email successfully sent via Resend to ${userEmail} (ID: ${data?.id})`);
        return true;
      }

      this.logger.log(`[Dev Email Simulation] Targeted Bounty to ${userEmail}: "${postTitle}" by ${authorUsername}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send targeted bounty email to ${userEmail}: ${error.message}`);
      return false;
    }
  }
}
