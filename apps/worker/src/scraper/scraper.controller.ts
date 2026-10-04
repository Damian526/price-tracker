import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { Browser, chromium } from 'playwright';
import { XkomParser } from 'src/parsers/XkomParser';

export interface ScarpeJobPayload {
  url: string;
  targetPrice: number;
  lastAlertedPrice: number | null;
}

@Controller()
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);
  private parsers = [new XkomParser()];

  @EventPattern('scrape_job')
  async handleScrapeJob(
    @Payload() data: ScarpeJobPayload,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    let browser: Browser | null = null;

    try {
      this.logger.log(`Starting scrape for: ${data.url}`);

      const delay = Math.floor(Math.random() * 10000) + 5000;
      await new Promise((res) => setTimeout(res, delay));

      browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      const browserContext = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await browserContext.newPage();
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
          void route.abort();
        } else {
          void route.continue();
        }
      });

      const parser = this.parsers.find((p) => p.matches(data.url));
      if (!parser) throw new Error('No parser found for this store');

      await page.goto(data.url, { waitUntil: 'domcontentloaded' });
      const result = await parser.parse(page);
      this.logger.log(`Scraped Price: ${result.price} zł`);

      // todo: update the currentPrice, save a snapshot, and check if alert is needed
      if (
        result.price <= data.targetPrice &&
        result.price !== data.lastAlertedPrice
      ) {
        this.logger.log(`ALERT! Price dropped to ${result.price}`);
        // Send email here via NotificationService
      }

      // tell rabbitMq that job job was success and can be deleted from queue
      channel.ack(originalMsg);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape ${data.url}: ${errorMessage}`);

      // Ack message on fatal error so RabbitMQ doesn't loop infinitely
      channel.ack(originalMsg);
    } finally {
      // 7. ALWAYS close the browser context to free up server RAM[cite: 1]
      if (browser) {
        await browser.close();
      }
    }
  }
}
