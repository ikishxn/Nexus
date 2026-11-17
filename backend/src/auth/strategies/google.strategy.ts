import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID =
      configService.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID ||
      'placeholder_google_client_id';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') ||
      process.env.GOOGLE_CLIENT_SECRET ||
      'placeholder_google_client_secret';
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.validateGoogleUser(profile);
      done(null, user);
    } catch (err) {
      this.logger.error('Google OAuth validation error:', err);
      done(err as Error, false);
    }
  }
}
