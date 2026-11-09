import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Tracker, TrackerDocument } from '@price-tracker/database';
import { RABBITMQ_PATTERNS, ScrapeJobPayload } from '@price-tracker/shared';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(
    @InjectModel(Tracker.name) private trackerModel: Model<TrackerDocument>,
    @Inject('SCRAPE_SERVICE') private rabbitClient: ClientProxy,
  ) {}
  @Cron(CronExpression.EVERY_2_HOURS) // runs every 2 hours
  async handleCron() {
    this.logger.log('Finding active trackers...');
    try {
      const activeTrackers = await this.trackerModel
        .find({ active: true })
        .exec();

      if (activeTrackers.length === 0) {
        this.logger.log('No active trackers found, cron go back sleep');
        return;
      }
      this.logger.log(
        `Found ${activeTrackers.length} active trackers. Pushing to RabbitMQ...`,
      );

      // go though loop and put one job per one tracker into durable queue
      let jobsQueued = 0;
      for (const tracker of activeTrackers) {
        const payload: ScrapeJobPayload = {
          trackerId: tracker._id.toString(),
        };

        this.rabbitClient.emit(RABBITMQ_PATTERNS.SCRAPE_JOB, payload);
        jobsQueued++;
      }
      this.logger.log(`✅ Successfully queued ${jobsQueued} scraping jobs.`);
    } catch (error) {
      this.logger.error(`❌ Failed to schedule scraping jobs: ${error}`);
    }
  }
}
