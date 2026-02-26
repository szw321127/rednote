import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'refresh';
  tokenVersion: number;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname || dto.email.split('@')[0],
      quotaResetAt: this.getNextMonthStart(),
      tokenVersion: 0,
    });

    const saved = await this.userRepo.save(user);
    this.logger.log(`User registered: userId=${saved.id}`);

    return this.issueTokens(saved, true);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: userId=${user.id}`);
    return this.issueTokens(user, true);
  }

  async refreshToken(userId: string, tokenVersion: number, jti: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      user.tokenVersion !== tokenVersion ||
      !user.refreshTokenJti ||
      user.refreshTokenJti !== jti
    ) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return this.issueTokens(user, false);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Reset quota if needed
    await this.checkAndResetQuota(user);

    const profile: Partial<User> = { ...user };
    delete profile.password;
    delete profile.refreshTokenJti;
    return profile;
  }

  private async issueTokens(user: User, revokeExistingSessions: boolean) {
    if (revokeExistingSessions) {
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    }

    user.refreshTokenJti = randomUUID();
    const persisted = await this.userRepo.save(user);

    const accessPayload: AccessTokenPayload = {
      sub: persisted.id,
      email: persisted.email,
      role: persisted.role,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      ...accessPayload,
      type: 'refresh',
      tokenVersion: persisted.tokenVersion,
      jti: persisted.refreshTokenJti,
    };

    return {
      accessToken: this.signAccessToken(accessPayload),
      refreshToken: this.signRefreshToken(refreshPayload),
      user: {
        id: persisted.id,
        email: persisted.email,
        nickname: persisted.nickname,
        plan: persisted.plan,
        role: persisted.role,
        quotaLimit: persisted.quotaLimit,
        quotaUsed: persisted.quotaUsed,
      },
    };
  }

  private signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  private signRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }

  private async checkAndResetQuota(user: User) {
    if (user.quotaResetAt && new Date() >= user.quotaResetAt) {
      user.quotaUsed = 0;
      user.quotaResetAt = this.getNextMonthStart();
      await this.userRepo.save(user);
    }
  }

  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}
