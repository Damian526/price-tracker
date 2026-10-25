import { Module } from '@nestjs/common';
import { ScraperController } from './scraper/scraper.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PriceSnapshot,
  PriceSnapshotSchema,
  Tracker,
  TrackerSchema,
} from '@price-tracker/database';
import { ScraperService } from './scraper/scraper.service';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Tracker.name, schema: TrackerSchema },
      { name: PriceSnapshot.name, schema: PriceSnapshotSchema },
    ]),
  ],
  controllers: [ScraperController],
  providers: [ScraperService, MailService],
})
export class AppModule {}
