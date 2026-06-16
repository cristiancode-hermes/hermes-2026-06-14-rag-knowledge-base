import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto = { email: 'test@example.com', username: 'testuser', password: 'password123' };
      const expected = { token: 'jwt', user: { id: '1', email: dto.email, username: dto.username, createdAt: new Date() } };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const expected = { token: 'jwt', user: { id: '1', email: dto.email, username: 'testuser', createdAt: new Date() } };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should return user without password', () => {
      const req = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          password: 'secret',
          createdAt: new Date(),
        },
      };

      const result = controller.getProfile(req);

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).not.toHaveProperty('password');
    });
  });
});
