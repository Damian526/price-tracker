import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Tracker } from '../schemas/tracker.schema';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(
    @InjectModel(Tracker.name) private trackerModel: Model<Tracker>,
    @Inject('SCRAPE_SERVICE') private rabbitClient: ClientProxy,
  ) {}
  @Cron('0 */2 * * *') // runs every 2 hours
  async handleCron() {
    this.logger.log('Finding active trackers...');

    const activeTrackers = await this.trackerModel
      .find({ active: true })
      .exec();

    // go though loop and put one job per one tracker into durable queue
    for (const tracker of activeTrackers) {
      this.rabbitClient.emit('scrape_job', {
        trackerId: tracker._id.toString(),
        url: tracker.url,
        targetPrice: tracker.targetPrice,
      });
    }
  }
}
