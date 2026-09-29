import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceSnapshot } from 'src/schemas/price-snapshot.schema';
import { Tracker } from 'src/schemas/tracker.schema';
import { CreateTrackerDto } from './dto/create-tracker.dto';

@Injectable()
export class TrackersService {
  constructor(
    @InjectModel(Tracker.name) private trackerModel: Model<Tracker>,
    @InjectModel(PriceSnapshot.name)
    private snapshotModel: Model<PriceSnapshot>,
    @Inject('SCRAPE_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(createTrackerDto: CreateTrackerDto) {
    const urlObj = new URL(createTrackerDto.url);
    const store = urlObj.hostname.replace('www.', '');
    const tracker = new this.trackerModel({
      url: createTrackerDto.url,
      targetPrice: createTrackerDto.targetPrice,
      store: store,
    });
    const savedTracker = await tracker.save();

    // Immediately push a job to RabbitMQ so it gets scraped right away
    this.rabbitClient.emit('scrape_job', {
      trackerId: savedTracker._id,
      url: savedTracker.url,
      targetPrice: savedTracker.targetPrice,
    });

    return savedTracker;
  }
  async findAll(): Promise<Tracker[]> {
    return this.trackerModel.find().exec();
  }

  async findOne(id: string) {
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
}
