import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './user.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;
    mockJwtService = {
      sign: jest.fn(),
    } as any;
    service = new AuthService(mockUserRepo as any, mockJwtService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user and return token with user info', async () => {
      // First call (email check) returns null, second call (username check) returns null
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepo.create.mockReturnValue({
        id: 'uuid-123',
        email: registerDto.email,
        username: registerDto.username,
        password: 'hashed-password',
        createdAt: new Date(),
      } as User);
      mockUserRepo.save.mockResolvedValue({
        id: 'uuid-123',
        email: registerDto.email,
        username: registerDto.username,
        password: 'hashed-password',
        createdAt: new Date(),
      } as User);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.username).toBe(registerDto.username);
      expect(mockUserRepo.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'uuid-123' });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing', email: registerDto.email } as User);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when username already taken', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValueOnce({ id: 'existing', username: registerDto.username } as User); // username fails

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return token with user info', async () => {
      const user = {
        id: 'uuid-123',
        email: loginDto.email,
        username: 'testuser',
        password: 'hashed-password',
        createdAt: new Date(),
      } as User;

      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'uuid-123' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const user = {
        id: 'uuid-123',
        email: loginDto.email,
        password: 'hashed-password',
      } as User;

      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com' } as User;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('uuid-123');

      expect(result).toEqual(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-123' } });
    });

    it('should return null when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
