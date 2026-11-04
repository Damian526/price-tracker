import { Injectable, Logger } from '@nestjs/common';
import { XkomParser } from 'src/parsers/XkomParser';
import {
  PriceSnapshot,
  PriceSnapshotDocument,
  SearchSession,
  SearchSessionDocument,
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
    @InjectModel(SearchSession.name)
    private readonly searchSessionModel: Model<SearchSessionDocument>,
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
  async processSearchJob(sessionId: string, query: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      this.logger.error(`Invalid sessionId received: ${sessionId}`);
      return;
    }

    let browser: Browser | null = null;

    try {
      this.logger.log(`Starting search aggregator for: "${query}"`);

      // 1. Launch Playwright safely
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // 2. Build the search URL and navigate
      const searchUrl = this.xkomParser.getSearchUrl(query);
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // 3. Extract the top 3 results using your parser
      const searchResults = await this.xkomParser.parseSearchResults(page, 3);

      // Add the store name to the results (since the shared interface expects it)
      const formattedResults = searchResults.map((result) => ({
        ...result,
        store: 'x-kom.pl',
        imageUrl: '', // Optional: update your parser to grab images later!
      }));

      // 4. Save results to MongoDB and mark session completed
      await this.searchSessionModel.findByIdAndUpdate(sessionId, {
        $set: {
          status: 'completed',
          results: formattedResults,
        },
      });

      this.logger.log(
        `✅ Search session ${sessionId} completed with ${formattedResults.length} results.`,
      );
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Search failed for session ${sessionId}: ${errMessage}`,
      );

      // Mark session as failed so the frontend stops polling
      await this.searchSessionModel.findByIdAndUpdate(sessionId, {
        $set: { status: 'failed' },
      });
    } finally {
      // 5. CRITICAL: Close the browser to free RAM
      if (browser) {
        await browser.close();
      }
    }
  }
}
