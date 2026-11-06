import { Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

// The real service imports Playwright, we only need its class as a token
jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
}));

// @nestjs/config is ESM-only and jest runs CommonJS, so we fake it too
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

describe('ScraperController.handleSearchJob (Unit)', () => {
  const payload = { sessionId: '507f1f77bcf86cd799439011', query: 'laptop' };

  let controller: ScraperController;
  let mockScraperService: { processSearchJob: jest.Mock };
  let mockChannel: { ack: jest.Mock };
  let mockMessage: object;
  let mockContext: RmqContext;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Arrange: fake service and fake RabbitMQ context
    mockScraperService = { processSearchJob: jest.fn() };
    mockChannel = { ack: jest.fn() };
    mockMessage = { content: 'fake-message' };
    mockContext = {
      getChannelRef: () => mockChannel,
      getMessage: () => mockMessage,
    } as unknown as RmqContext;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScraperController],
      providers: [{ provide: ScraperService, useValue: mockScraperService }],
    }).compile();

    controller = module.get<ScraperController>(ScraperController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process the job and ack the message', async () => {
    // Act
    await controller.handleSearchJob(payload, mockContext);

    // Assert
    expect(mockScraperService.processSearchJob).toHaveBeenCalledWith(
      payload.sessionId,
      payload.query,
    );
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it('should still ack the message when the service throws', async () => {
    // Arrange
    mockScraperService.processSearchJob.mockRejectedValue(new Error('boom'));

    // Act: must not throw out of the controller
    await expect(
      controller.handleSearchJob(payload, mockContext),
    ).resolves.toBeUndefined();

    // Assert
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });
});
