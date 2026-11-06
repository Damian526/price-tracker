import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Tracker, TrackerSchema } from '@price-tracker/database';
import { PriceSnapshot, PriceSnapshotSchema } from '@price-tracker/database';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TrackersController } from './trackers/trackers.controller';
import { TrackersService } from './trackers/trackers.service';
import { CronService } from './cron/cron.service';
import { MessagingModule } from './messaging/messaging.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI') ?? '',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Tracker.name, schema: TrackerSchema },
      { name: PriceSnapshot.name, schema: PriceSnapshotSchema },
    ]),
    MessagingModule,
    SearchModule,
    ScheduleModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'SCRAPE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'scrape',
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [TrackersController],
  providers: [TrackersService, CronService],
})
export class AppModule {}
