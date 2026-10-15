import { Page } from 'playwright';
import { StoreParser } from './store-parser.inteface';
import { parsePolishPrice } from '../utils/price.parser';

const BASE_URL = 'https://www.x-kom.pl';

export interface SearchResult {
  title: string;
  price: number;
  url: string;
}

export class XkomParser implements StoreParser {
  matches(url: string): boolean {
    return url.includes('x-kom.pl');
  }

  getSearchUrl(query: string): string {
    return `${BASE_URL}/szukaj?q=${encodeURIComponent(query)}`;
  }

  async parseSearchResults(page: Page, limit = 3): Promise<SearchResult[]> {
    const cards = page.locator('[data-name="productCard"]');
    await cards.first().waitFor({ state: 'attached', timeout: 10000 });

    const count = Math.min(await cards.count(), limit);
    const results: SearchResult[] = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = (await card.locator('h3').first().innerText()).trim();
      const priceText = await card
        .locator('[data-name="productPrice"]')
        .first()
        .innerText();
      const href = await card
        .locator('a[href^="/p/"]')
        .first()
        .getAttribute('href');

      if (!href) continue;

      // Drop tracking params (?cid=...&eid=...) so the URL is stable
      const url = new URL(href, BASE_URL);
      url.search = '';

      results.push({
        title,
        price: parsePolishPrice(priceText),
        url: url.toString(),
      });
    }

    return results;
  }

  async parse(page: Page) {
    const titleLocator = page.locator('h1[data-name="productTitle"]');
    const priceLocator = page.locator('div[data-name="productPrice"]').first();

    await priceLocator.waitFor({ state: 'visible', timeout: 10000 });

    const title = await titleLocator.first().innerText();
    const priceText = await priceLocator.first().innerText();
    console.log(`RAW TEXT: "${priceText}"`);

    console.log(`RAW GRABBED TEXT: "${priceText}"`);

    return {
      title,
      price: parsePolishPrice(priceText),
    };
  }
}
