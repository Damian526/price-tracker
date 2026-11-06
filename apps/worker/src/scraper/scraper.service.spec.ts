import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PriceSnapshot,
  SearchSession,
  Tracker,
} from '@price-tracker/database';
import { chromium } from 'playwright';
import { MailService } from '../mail/mail.service';
import { ScraperService } from './scraper.service';

// Replace the real browser with a fake one, so no Chromium is started
jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
}));

// @nestjs/config is ESM-only and jest runs CommonJS, so we fake it too
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

describe('ScraperService.processSearchJob (Unit)', () => {
  const VALID_SESSION_ID = '507f1f77bcf86cd799439011';

  let service: ScraperService;
  let mockSearchSessionModel: { findByIdAndUpdate: jest.Mock };
  let mockParser: { getSearchUrl: jest.Mock; parseSearchResults: jest.Mock };
  let mockPage: { goto: jest.Mock };
  let mockBrowser: { newContext: jest.Mock; close: jest.Mock };

  beforeEach(async () => {
    // Keep test output clean (the service logs errors on purpose)
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Arrange: fake browser -> context -> page
    mockPage = { goto: jest.fn().mockResolvedValue(undefined) };
    mockBrowser = {
      newContext: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue(mockPage),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (chromium.launch as jest.Mock).mockReset();
    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    // Arrange: fake DB model and fake x-kom parser
    mockSearchSessionModel = { findByIdAndUpdate: jest.fn() };
    mockParser = {
      getSearchUrl: jest.fn().mockReturnValue('https://x-kom.pl/szukaj?q=pc'),
      parseSearchResults: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        { provide: getModelToken(Tracker.name), useValue: {} },
        { provide: getModelToken(PriceSnapshot.name), useValue: {} },
        {
          provide: getModelToken(SearchSession.name),
          useValue: mockSearchSessionModel,
        },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
    // The parser is created inside the class, so we swap it for our fake
    (service as any).xkomParser = mockParser;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should save results and mark the session completed', async () => {
    // Arrange
    mockParser.parseSearchResults.mockResolvedValue([
      { title: 'Laptop A', price: 2999, url: 'https://x-kom.pl/p/1' },
      { title: 'Laptop B', price: 3499, url: 'https://x-kom.pl/p/2' },
    ]);

    // Act
    await service.processSearchJob(VALID_SESSION_ID, 'laptop');

    // Assert
    expect(mockParser.getSearchUrl).toHaveBeenCalledWith('laptop');
    expect(mockParser.parseSearchResults).toHaveBeenCalledWith(mockPage, 3);
    expect(mockSearchSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_SESSION_ID,
      {
        $set: {
          status: 'completed',
          results: [
            {
              title: 'Laptop A',
              price: 2999,
              url: 'https://x-kom.pl/p/1',
              store: 'x-kom.pl',
              imageUrl: '',
            },
            {
              title: 'Laptop B',
              price: 3499,
              url: 'https://x-kom.pl/p/2',
              store: 'x-kom.pl',
              imageUrl: '',
            },
          ],
        },
      },
    );
  });

  it('should mark the session failed when the parser throws', async () => {
    // Arrange
    mockParser.parseSearchResults.mockRejectedValue(new Error('boom'));

    // Act
    await service.processSearchJob(VALID_SESSION_ID, 'laptop');

    // Assert
    expect(mockSearchSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_SESSION_ID,
      { $set: { status: 'failed' } },
    );
  });

  it('should return early for an invalid session id', async () => {
    // Act
    await service.processSearchJob('not-an-id', 'laptop');

    // Assert: nothing started, nothing saved
    expect(chromium.launch).not.toHaveBeenCalled();
    expect(mockSearchSessionModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should always close the browser after a successful search', async () => {
    // Arrange
    mockParser.parseSearchResults.mockResolvedValue([]);

    // Act
    await service.processSearchJob(VALID_SESSION_ID, 'laptop');

    // Assert
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it('should always close the browser after a failed search', async () => {
    // Arrange
    mockParser.parseSearchResults.mockRejectedValue(new Error('boom'));

    // Act
    await service.processSearchJob(VALID_SESSION_ID, 'laptop');

    // Assert
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });
});
