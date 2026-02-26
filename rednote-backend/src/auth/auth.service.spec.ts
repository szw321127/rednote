import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn((payload: any) => `${payload.type}-token`),
    };

    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') {
          return 'unit-test-jwt-secret-1234567890123456789012';
        }
        if (key === 'JWT_REFRESH_SECRET') {
          return 'unit-test-refresh-secret-1234567890123456';
        }
        throw new Error(`Unexpected key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and issue access/refresh tokens', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation((data: any) => ({
        id: 'uuid-1',
        role: 'user',
        plan: 'free',
        quotaLimit: 50,
        quotaUsed: 0,
        ...data,
      }));
      mockUserRepo.save.mockImplementation((user: any) =>
        Promise.resolve({ ...user, id: user.id || 'uuid-1' }),
      );

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');

      const persistedTokenState = mockUserRepo.save.mock.calls[1][0];
      expect(persistedTokenState.tokenVersion).toBe(1);
      expect(persistedTokenState.refreshTokenJti).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'wrong@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        password: hashedPassword,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        nickname: 'test',
        plan: 'free',
        quotaLimit: 50,
        quotaUsed: 0,
        tokenVersion: 2,
      });
      mockUserRepo.save.mockImplementation((user: any) =>
        Promise.resolve({ ...user }),
      );

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');

      const persistedTokenState = mockUserRepo.save.mock.calls[0][0];
      expect(persistedTokenState.tokenVersion).toBe(3);
      expect(persistedTokenState.refreshTokenJti).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should rotate refresh token jti on successful refresh', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user',
        nickname: 'test',
        plan: 'free',
        quotaLimit: 50,
        quotaUsed: 0,
        tokenVersion: 5,
        refreshTokenJti: 'old-jti',
      });
      mockUserRepo.save.mockImplementation((user: any) =>
        Promise.resolve({ ...user }),
      );

      const result = await service.refreshToken('uuid-1', 5, 'old-jti');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');

      const persistedTokenState = mockUserRepo.save.mock.calls[0][0];
      expect(persistedTokenState.tokenVersion).toBe(5);
      expect(persistedTokenState.refreshTokenJti).not.toBe('old-jti');
    });

    it('should reject revoked refresh token', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        tokenVersion: 3,
        refreshTokenJti: 'current-jti',
      });

      await expect(
        service.refreshToken('uuid-1', 3, 'stale-jti'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
