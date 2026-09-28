import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tracker extends Document {
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) store: string;
  @Prop() title: string;
  @Prop() imageUrl: string;
  @Prop({ required: true }) targetPrice: number;
  @Prop() currentPrice: number;
  @Prop() currency: string;
  @Prop() lastCheckedAt: Date;
  @Prop({ default: 'ok' }) lastStatus: string;
  @Prop() lastAlertedPrice: number;
  @Prop({ default: true }) active: boolean;
}

export const TrackerSchema = SchemaFactory.createForClass(Tracker);
