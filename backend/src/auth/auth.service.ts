import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

const SALT_ROUNDS = 12;

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    reputationScore: number;
    totalReputation?: number;
    walletBalance: number;
    badges?: string[];
    role: string;
    createdAt?: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);

    if (existingEmail) {
      if (existingEmail.isVerified === false) {
        // User registered previously but never verified. Update credentials and resend verification.
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        existingEmail.username = dto.username;
        existingEmail.passwordHash = passwordHash;
        existingEmail.verificationToken = verificationToken;
        await existingEmail.save();

        const frontendUrl =
          this.configService.get<string>('FRONTEND_URL') ||
          process.env.FRONTEND_URL ||
          'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/#/verify-email/${verificationToken}`;

        this.mailService
          .sendVerificationEmail(existingEmail.email, verifyUrl, existingEmail.username)
          .catch((err) =>
            this.logger.error(`Failed to dispatch verification email to ${existingEmail.email}: ${err.message}`),
          );

        return {
          message: 'Registration updated! Please check your email to verify your account.',
          email: existingEmail.email,
        };
      }

      throw new ConflictException('Email is already registered. Please sign in instead.');
    }

    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash,
      isVerified: false,
      verificationToken,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/#/verify-email/${verificationToken}`;

    // Dispatch verification email in background without blocking registration response
    this.mailService
      .sendVerificationEmail(user.email, verifyUrl, user.username)
      .catch((err) =>
        this.logger.error(`Failed to dispatch verification email to ${user.email}: ${err.message}`),
      );

    return {
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      email: user.email,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string; isVerified: boolean }> {
    if (!token) {
      throw new BadRequestException('Verification token is missing.');
    }

    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Verification token is invalid or has already been used.');
    }

    await this.usersService.verifyUser(user._id);

    return {
      message: 'Your email has been successfully verified! You can now log in.',
      isVerified: true,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isVerified === false) {
      const strictVerification =
        this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true' ||
        process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

      if (strictVerification) {
        throw new ForbiddenException(
          'Please verify your email address before logging in. Check your inbox for the verification link.',
        );
      }

      // If strict verification is disabled (default until Resend/SMTP is configured in production), auto-verify on valid login
      await this.usersService.verifyUser(user._id);
      this.logger.log(`Auto-verified user ${user.email} on valid credentials login.`);
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(
        `[ForgotPassword] Reset requested for "${dto.email}", but this email was NOT found in the database. No email was dispatched.`,
      );
      return {
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setResetPasswordToken(user.email, hashedToken, expires);

    const frontendUrl =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';
    const resetUrl = `${frontendUrl}/#/reset-password/${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetUrl, user.username);

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, dto: ResetPasswordDto): Promise<{ message: string }> {
    const newPassword = dto.newPassword || dto.password;
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetPasswordToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Password reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersService.resetPassword(user._id, passwordHash);

    return {
      message: 'Password has been reset successfully. You can now log in with your new credentials.',
    };
  }

  async validateGoogleUser(profile: any): Promise<UserDocument> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new BadRequestException('Google account must provide an email address.');
    }

    let user = await this.usersService.findByEmail(email);

    if (user) {
      let shouldSave = false;
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationToken = null;
        shouldSave = true;
      }
      if (!user.googleId) {
        user.googleId = profile.id;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
      return user;
    }

    // New Google User Creation
    const baseName =
      profile.displayName?.trim().replace(/[^a-zA-Z0-9_]/g, '') ||
      email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') ||
      'dev';
    let username = baseName.slice(0, 24);

    const existingName = await this.usersService.findByUsername(username);
    if (existingName) {
      username = `${username.slice(0, 18)}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    user = await this.usersService.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      isVerified: true,
      googleId: profile.id,
    });

    return user;
  }

  async getMe(userId: string): Promise<AuthResponse['user']> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      reputationScore: user.reputationScore,
      totalReputation: user.totalReputation ?? user.reputationScore ?? 0,
      walletBalance: user.walletBalance,
      badges: user.badges || [],
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public buildAuthResponse(user: UserDocument): AuthResponse {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        reputationScore: user.reputationScore,
        totalReputation: user.totalReputation ?? user.reputationScore ?? 0,
        walletBalance: user.walletBalance,
        badges: user.badges || [],
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
