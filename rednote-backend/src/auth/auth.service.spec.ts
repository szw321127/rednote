import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation((data) => ({
        id: 'uuid-1',
        ...data,
      }));
      mockUserRepo.save.mockImplementation((user) =>
        Promise.resolve({ ...user, id: 'uuid-1' }),
      );

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
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
        nickname: 'test',
        plan: 'free',
        quotaLimit: 50,
        quotaUsed: 0,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
