import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController (Unit)', () => {
  let controller: SearchController;
  let mockSearchService: {
    initiateSearch: jest.Mock;
    getSearchSession: jest.Mock;
  };

  beforeEach(async () => {
    // Arrange: fake service, the controller should only pass data through
    mockSearchService = {
      initiateSearch: jest.fn(),
      getSearchSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should pass the query from the body to initiateSearch', async () => {
    // Arrange
    mockSearchService.initiateSearch.mockResolvedValue({ session: 'abc' });

    // Act
    const result = await controller.search('laptop');

    // Assert
    expect(mockSearchService.initiateSearch).toHaveBeenCalledWith('laptop');
    expect(result).toEqual({ session: 'abc' });
  });

  it('should pass the id from the url to getSearchSession', async () => {
    // Arrange
    const session = { _id: 'abc', status: 'pending' };
    mockSearchService.getSearchSession.mockResolvedValue(session);

    // Act
    const result = await controller.getSession('abc');

    // Assert
    expect(mockSearchService.getSearchSession).toHaveBeenCalledWith('abc');
    expect(result).toBe(session);
  });
});
