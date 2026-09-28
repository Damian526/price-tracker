import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class PriceSnapshot extends Document {
  @Prop({ type: Types.ObjectId, required: true }) trackerId: Types.ObjectId;
  @Prop({ required: true }) price: number;
  @Prop({ required: true, default: Date.now }) scrapedAt: Date;
}

export const PriceSnapshotSchema = SchemaFactory.createForClass(PriceSnapshot);
// The compound index for fast history charting
PriceSnapshotSchema.index({ trackerId: 1, scrapedAt: 1 });
