import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { SearchSession, SearchSessionDocument } from '@price-tracker/database';
import { Model } from 'mongoose';
import { RABBITMQ_PATTERNS, SearchJobPayload } from '@price-tracker/shared';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(SearchSession.name)
    private searchSessionModel: Model<SearchSessionDocument>,
    @Inject('SCRAPE_SERVICE') private rabbitClient: ClientProxy,
  ) {}
  async initiateSearch(query: string) {
    const session = await this.searchSessionModel.create({
      query,
      status: 'pending',
      results: [],
    });
    const payload: SearchJobPayload = {
      sessionId: session._id.toString(),
      query,
    };
    this.rabbitClient.emit(RABBITMQ_PATTERNS.SEARCH_AGGREGATOR_JOB, payload);
    return { sessionId: session._id.toString() };
  }

  async getSearchSession(sessionId: string) {
    return this.searchSessionModel.findById(sessionId);
  }
}
