import { Controller, Logger } from '@nestjs/common';
import type { Channel, ConsumeMessage } from 'amqplib';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import * as shared from '@price-tracker/shared';
import { ScraperService } from './scraper.service';

@Controller()
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @EventPattern(shared.RABBITMQ_PATTERNS.SCRAPE_JOB)
  async handleScrapeJob(
    @Payload() data: shared.ScrapeJobPayload,
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
}
