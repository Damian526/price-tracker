import { Controller, Logger } from '@nestjs/common';
import type { Channel, ConsumeMessage } from 'amqplib';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ScraperService } from './scraper.service';
import type { ScrapeJobPayload, SearchJobPayload } from '@price-tracker/shared';
import { RABBITMQ_PATTERNS } from '@price-tracker/shared';
@Controller()
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @EventPattern(RABBITMQ_PATTERNS.SCRAPE_JOB)
  async handleScrapeJob(
    @Payload() data: ScrapeJobPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    this.logger.log(`Received scrape_job for trackerId: ${data.trackerId}`);

    try {
      await this.scraperService.processScrapeJob(data.trackerId);
    } catch (unexpectedError) {
      this.logger.error(`Unexpected error in controller: ${unexpectedError}`);
    } finally {
      // Always ACK the message so RabbitMQ moves to the next job in the queue
      channel.ack(originalMsg);
    }
  }

  @EventPattern(RABBITMQ_PATTERNS.SEARCH_AGGREGATOR_JOB)
  async handleSearchJob(
    @Payload() data: SearchJobPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;

    this.logger.log(
      `Received search_aggregator_job for sessionId: ${data.sessionId}`,
    );

    try {
      await this.scraperService.processSearchJob(data.sessionId, data.query);
    } catch (unexpectedError) {
      this.logger.error(
        `Unexpected error in search controller: ${unexpectedError}`,
      );
    } finally {
      // ALWAYS ACK the message to prevent infinite retry loops
      channel.ack(originalMsg);
    }
  }
}
