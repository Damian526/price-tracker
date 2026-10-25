import { Injectable, Logger } from '@nestjs/common';
import { XkomParser } from 'src/parsers/XkomParser';
import {
  PriceSnapshot,
  PriceSnapshotDocument,
  Tracker,
  TrackerDocument,
} from '@price-tracker/database';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Browser, chromium } from 'playwright';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly xkomParser = new XkomParser();

  constructor(
    @InjectModel(Tracker.name)
    private readonly trackerModel: Model<TrackerDocument>,
    @InjectModel(PriceSnapshot.name)
    private readonly snapshotModel: Model<PriceSnapshotDocument>,
    private readonly mailService: MailService,
    private configService: ConfigService,
  ) {}

  async processScrapeJob(trackerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(trackerId)) {
      this.logger.error(`Invalid trackerId received: ${trackerId}`);
      return;
    }

    // fetch tracker from db
    const tracker = await this.trackerModel.findById(trackerId);
    if (!tracker || !tracker.active) {
      this.logger.warn(`Tracker ${trackerId} not found or inactive. Skipping.`);
      return;
    }

    let browser: Browser | null = null;

    try {
      this.logger.log(
        `Launching headless browser for tracker ${trackerId} (${tracker.url})`,
      );

      browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      await page.goto(tracker.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Extract data
      const { price: scrapedPrice, title } = await this.xkomParser.parse(page);

      if (
        scrapedPrice === null ||
        Number.isNaN(scrapedPrice) ||
        scrapedPrice <= 0
      ) {
        throw new Error(`Invalid price extracted: ${scrapedPrice}`);
      }
      const now = new Date();

      // 5. Save Historical PriceSnapshot to MongoDB
      await this.snapshotModel.create({
        trackerId: tracker._id,
        price: scrapedPrice,
        scrapedAt: now,
      });

      if (title !== '') {
        tracker.title = title;
      }

      const isBelowOrEqualTarget = scrapedPrice <= tracker.targetPrice;
      const isLowerThanLastAlert =
        tracker.lastAlertedPrice === undefined ||
        tracker.lastAlertedPrice === null ||
        scrapedPrice < tracker.lastAlertedPrice;

      if (isBelowOrEqualTarget && isLowerThanLastAlert) {
        const recipient = this.configService.get<string>(
          'ALERT_RECEIVER_EMAIL',
          'test@example.com',
        );

        const emailSent = await this.mailService.sendPriceDropAlert({
          to: recipient,
          productTitle: tracker.title || tracker.store,
          url: tracker.url,
          currentPrice: scrapedPrice,
          targetPrice: tracker.targetPrice,
          currency: tracker.currency || 'PLN',
        });

        if (emailSent) {
          tracker.lastAlertedPrice = scrapedPrice;
        }
      }
      tracker.currentPrice = scrapedPrice;
      tracker.lastCheckedAt = now;
      tracker.lastStatus = 'ok';
      await tracker.save();

      this.logger.log(
        `✅ Tracker ${trackerId} updated: ${scrapedPrice} ${tracker.currency}`,
      );
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Scraping failed for tracker ${trackerId}: ${errMessage}`,
      );
      await this.trackerModel.findByIdAndUpdate(trackerId, {
        $set: {
          lastStatus: 'failed',
          lastCheckedAt: new Date(),
        },
      });
    } finally {
      // 10. CRITICAL FOR 1GB RAM: Always close browser in finally block
      if (browser) {
        await browser.close();
        this.logger.debug(`Browser closed for tracker ${trackerId}`);
      }
    }
  }
}
