import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchSession, SearchSessionSchema } from '@price-tracker/database';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SearchSession.name, schema: SearchSessionSchema },
    ]),
    MessagingModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
