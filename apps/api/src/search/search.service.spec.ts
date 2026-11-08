import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchSession } from '@price-tracker/database';
import { RABBITMQ_PATTERNS } from '@price-tracker/shared';

describe('SearchService (Unit)', () => {
  let service: SearchService;
  let mockRabbitClient: { emit: jest.Mock };
  let mockSearchSessionModel: { create: jest.Mock; findById: jest.Mock };

  beforeEach(async () => {
    // 1. Arrange: fake RabbitMQ client and fake Mongo model
    mockRabbitClient = { emit: jest.fn() };
    mockSearchSessionModel = {
      create: jest.fn().mockResolvedValue({ _id: 'fake-session-id' }),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getModelToken(SearchSession.name),
          useValue: mockSearchSessionModel,
        },
        { provide: 'SCRAPE_SERVICE', useValue: mockRabbitClient },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('initiateSearch', () => {
    it('should create a pending session with empty results', async () => {
      // Act
      await service.initiateSearch('laptop');

      // Assert
      expect(mockSearchSessionModel.create).toHaveBeenCalledWith({
        query: 'laptop',
        status: 'pending',
        results: [],
      });
    });

    it('should publish a search job with the session id and query', async () => {
      // Act
      await service.initiateSearch('laptop');

      // Assert
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        RABBITMQ_PATTERNS.SEARCH_AGGREGATOR_JOB,
        { sessionId: 'fake-session-id', query: 'laptop' },
      );
    });

    it('should return the id of the new session', async () => {
      // Act
      const result = await service.initiateSearch('laptop');

      // Assert
      expect(result).toEqual({ sessionId: 'fake-session-id' });
    });
  });

  describe('getSearchSession', () => {
    it('should return the session found by id', async () => {
      // Arrange
      const session = { _id: 'abc', query: 'laptop', status: 'completed' };
      mockSearchSessionModel.findById.mockResolvedValue(session);

      // Act
      const result = await service.getSearchSession('abc');

      // Assert
      expect(mockSearchSessionModel.findById).toHaveBeenCalledWith('abc');
      expect(result).toBe(session);
    });

    it('should return null for an unknown id', async () => {
      // Arrange
      mockSearchSessionModel.findById.mockResolvedValue(null);

      // Act
      const result = await service.getSearchSession('does-not-exist');

      // Assert
      expect(result).toBeNull();
    });
  });
});
