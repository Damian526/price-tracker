import { Page } from 'playwright';
export interface StoreParser {
  matches(url: string): boolean;
  parse(page: Page): Promise<{ price: number; title: string }>;
}
