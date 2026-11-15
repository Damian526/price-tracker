import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PriceSnapshot,
  PriceSnapshotDocument,
  TrackerDocument,
} from '@price-tracker/database';
import { Tracker } from '@price-tracker/database';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { RABBITMQ_PATTERNS, ScrapeJobPayload } from '@price-tracker/shared';

@Injectable()
export class TrackersService {
  constructor(
    @InjectModel(Tracker.name) private trackerModel: Model<TrackerDocument>,
    @InjectModel(PriceSnapshot.name)
    private snapshotModel: Model<PriceSnapshotDocument>,
    @Inject('SCRAPE_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(createTrackerDto: CreateTrackerDto) {
    // Extract domain name automatically (e.g., "https://www.x-kom.pl/..." -> "x-kom.pl")
    const parsedUrl = new URL(createTrackerDto.url);
    const store = parsedUrl.hostname.replace(/^www\./, '');

    const tracker = await this.trackerModel.create({
      ...createTrackerDto,
      store,
      lastStatus: 'pending',
    });

    // Immediately queue a scrape job so the user doesn't wait 2 hours!
    const payload: ScrapeJobPayload = { trackerId: tracker._id.toString() };
    this.rabbitClient.emit(RABBITMQ_PATTERNS.SCRAPE_JOB, payload);

    return tracker;
  }

  async triggerManualScrape(id: string) {
    const tracker = await this.findOne(id);
    tracker.lastStatus = 'pending';
    await tracker.save();

    const payload: ScrapeJobPayload = { trackerId: tracker._id.toString() };
    this.rabbitClient.emit(RABBITMQ_PATTERNS.SCRAPE_JOB, payload);

    return { queued: true, trackerId: tracker._id };
  }

  async findAll(): Promise<Tracker[]> {
    return this.trackerModel.find().exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid tracker ID`);
    }

    const tracker = await this.trackerModel.findById(id).exec();
    if (!tracker) throw new NotFoundException('Tracker not found');
    return tracker;
  }

  async getHistory(id: string, days: number = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    return this.snapshotModel
      .find({
        trackerId: id,
        scrapedAt: { $gte: dateLimit },
      })
      .sort({ scrapedAt: 1 })
      .exec();
  }
  async remove(trackerId: string) {
    const tracker = await this.trackerModel.findByIdAndDelete(trackerId);
    if (!tracker) {
      throw new NotFoundException(`Tracker ${trackerId} not found`);
    }
    await this.snapshotModel.deleteMany({ trackerId });
    return { success: true };
  }
}
