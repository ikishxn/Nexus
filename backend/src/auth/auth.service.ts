import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);

    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
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

  private buildAuthResponse(user: UserDocument): AuthResponse {
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
