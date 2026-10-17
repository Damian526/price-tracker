import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { TrackerStatus } from "@price-tracker/shared";

export type TrackerDocument = HydratedDocument<Tracker>;

@Schema({ timestamps: true })
export class Tracker {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  store: string;

  @Prop()
  title: string;

  @Prop()
  imageUrl: string;

  @Prop({ required: true })
  targetPrice: number;

  @Prop()
  currentPrice: number;

  @Prop({ default: "PLN" })
  currency: string;

  @Prop()
  lastCheckedAt: Date;

  @Prop({ type: String, default: "pending" })
  lastStatus: TrackerStatus;

  @Prop()
  lastAlertedPrice: number;

  @Prop({ default: true })
  active: boolean;
}

export const TrackerSchema = SchemaFactory.createForClass(Tracker);
