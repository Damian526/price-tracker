import { Page } from 'playwright';
export interface ParsedProduct {
  title: string;
  price: number;
  imageUrl?: string;
}

export interface ParsedSearchResult {
  title: string;
  price: number;
  url: string;
  imageUrl: string;
}
export interface StoreParser {
  readonly storeName: string;
  matches(url: string): boolean;
  getSearchUrl(query: string): string;
  parse(page: Page): Promise<ParsedProduct>;
  parseSearchResults(page: Page, limit?: number): Promise<ParsedSearchResult[]>;
}
