import { Test, TestingModule } from '@nestjs/testing';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

describe('SeedController', () => {
  let controller: SeedController;
  let mockSeedService: jest.Mocked<SeedService>;

  beforeEach(async () => {
    mockSeedService = {
      seed: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        { provide: SeedService, useValue: mockSeedService },
      ],
    }).compile();

    controller = module.get<SeedController>(SeedController);
  });

  describe('seed', () => {
    it('should call seedService.seed and return the result', async () => {
      const expected = {
        message: 'Database seeded successfully',
        documentCount: 5,
        chunkCount: 15,
      };
      mockSeedService.seed.mockResolvedValue(expected);

      const result = await controller.seed();

      expect(result).toEqual(expected);
      expect(mockSeedService.seed).toHaveBeenCalledTimes(1);
    });
  });
});
