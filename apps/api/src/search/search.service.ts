import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { SearchSessionDocument } from '@price-tracker/database';
import { Model } from 'mongoose';
import { RABBITMQ_PATTERNS, SearchJobPayload } from '@price-tracker/shared';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(SearchService.name)
    private searchSessionModel: Model<SearchSessionDocument>,
    @Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy,
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
    return { session: session._id };
  }

  async getSearchSession(sessionId: string) {
    return this.searchSessionModel.findById(sessionId);
  }
}
