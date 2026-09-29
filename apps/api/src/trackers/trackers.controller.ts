import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrackersService } from './trackers.service';
import { CreateTrackerDto } from './dto/create-tracker.dto';

@Controller('trackers')
export class TrackersController {
  constructor(private readonly trackersService: TrackersService) {}

  @Post()
  create(@Body() createTrackerDto: CreateTrackerDto) {
    return this.trackersService.create(createTrackerDto);
  }
  @Get()
  findAll() {
    return this.trackersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackersService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Query('days') days: string) {
    return this.trackersService.getHistory(id, days ? parseInt(days) : 30);
  }
}
