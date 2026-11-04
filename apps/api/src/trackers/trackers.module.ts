import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tracker, TrackerSchema } from '@price-tracker/database';

import { MessagingModule } from 'src/messaging/messaging.module';
import { TrackersController } from './trackers.controller';
import { TrackersService } from './trackers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tracker.name, schema: TrackerSchema }]),
    MessagingModule,
  ],
  controllers: [TrackersController],
  providers: [TrackersService],
})
export class SearchModule {}
