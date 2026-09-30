import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TrackersService } from './trackers.service';
import { Tracker } from '../schemas/tracker.schema';
import { PriceSnapshot } from '../schemas/price-snapshot.schema';

describe('TrackersService (Unit)', () => {
  let service: TrackersService;
  let mockRabbitClient: any;

  // 1. Arrange: Set up our fakes (Mocks)
  const mockTrackerModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: 'fake-id',
    save: jest.fn().mockResolvedValue({ ...dto, _id: 'fake-id' }),
  }));

  beforeEach(async () => {
    // Fake RabbitMQ client
    mockRabbitClient = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackersService,
        // Override the real DB models and Rabbit client with our fakes
        { provide: getModelToken(Tracker.name), useValue: mockTrackerModel },
        { provide: getModelToken(PriceSnapshot.name), useValue: {} },
        { provide: 'SCRAPE_SERVICE', useValue: mockRabbitClient },
      ],
    }).compile();

    service = module.get<TrackersService>(TrackersService);
  });

  // 2. Act & 3. Assert
  it('should extract the store name and publish a queue job on create', async () => {
    const dto = { url: 'https://www.x-kom.pl/p/123', targetPrice: 2000 };

    // Act: Call the real method
    const result = await service.create(dto);

    // Assert: Check if our logic worked
    expect(result.store).toBe('x-kom.pl'); // Proves our domain parsing works
    expect(mockRabbitClient.emit).toHaveBeenCalledWith('scrape_job', {
      trackerId: 'fake-id',
      url: dto.url,
      targetPrice: dto.targetPrice,
    });
  });
});
