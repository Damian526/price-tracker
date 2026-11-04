import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async search(@Body('query') query: string) {
    return this.searchService.initiateSearch(query);
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.searchService.getSearchSession(id);
  }
}
