// Queue Message Patterns
export const RABBITMQ_PATTERNS = {
  SCRAPE_JOB: "scrape_job",
  SEARCH_AGGREGATOR_JOB: "search_aggregator_job",
} as const;

// RabbimMQ message Payloads
export interface ScrapeJobPayload {
  trackerId: string;
  url?: string;
}

// domain status types
export type TrackerStatus = "pending" | "ok" | "failed";
export type SearchSessionStatus = "pending" | "completed" | "failed";

export interface ITracker {
  _id?: string;
  url: string;
  store: string;
  title?: string;
  imageUrl?: string;
  targetPrice: number;
  currentPrice?: number;
  currency: string;
  lastCheckedAt?: Date | string;
  lastStatus: TrackerStatus;
  lastAlertedPrice?: number;
  active: boolean;
}

export interface IPriceSnapshot {
  _id?: string;
  trackerId: string;
  price: number;
  scrapedAt: Date | string;
}

export interface ISearchResultItem {
  store: string;
  title: string;
  price: number;
  url: string;
  imageUrl: string;
}
