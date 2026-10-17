import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ISearchResultItem, SearchSessionStatus } from "@price-tracker/shared";

export type SearchSessionDocument = HydratedDocument<SearchSession>;

@Schema({ timestamps: true })
export class SearchSession {
  @Prop({ required: true })
  query: string;

  @Prop({ type: String, default: "pending" })
  status: SearchSessionStatus;

  @Prop({ type: Array, default: [] })
  results: ISearchResultItem[];
}

export const SearchSessionSchema = SchemaFactory.createForClass(SearchSession);
