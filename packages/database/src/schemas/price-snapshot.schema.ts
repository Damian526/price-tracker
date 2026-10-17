import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PriceSnapshotDocument = HydratedDocument<PriceSnapshot>;

@Schema()
export class PriceSnapshot {
  @Prop({ type: Types.ObjectId, ref: Tracker.name, required: true })
  trackerId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ default: Date.now })
  scrapedAt: Date;
}

import { Tracker } from "./tracker.schema";
export const PriceSnapshotSchema = SchemaFactory.createForClass(PriceSnapshot);

// Compound index for fast 30-day history chart queries
PriceSnapshotSchema.index({ trackerId: 1, scrapedAt: 1 });
