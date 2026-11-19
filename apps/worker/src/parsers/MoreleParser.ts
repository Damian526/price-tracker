import { Page } from 'playwright';
import {
  StoreParser,
  ParsedProduct,
  ParsedSearchResult,
} from './store-parser.inteface';
import { parsePolishPrice } from '../utils/price.parser';

const BASE_URL = 'https://www.morele.net';

export class MoreleParser implements StoreParser {
  readonly storeName = 'morele.net';

  matches(url: string): boolean {
    return url.includes('morele.net');
  }

  getSearchUrl(query: string): string {
    return `${BASE_URL}/wyszukiwarka/?q=${encodeURIComponent(query)}`;
  }

  async parseSearchResults(
    page: Page,
    limit = 3,
  ): Promise<ParsedSearchResult[]> {
    const cards = page.locator('.cat-product');
    await cards.first().waitFor({ state: 'attached', timeout: 10000 });

    const count = Math.min(await cards.count(), limit);
    const results: ParsedSearchResult[] = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const titleLink = card.locator('a.productLink').first();
      const title = (await titleLink.innerText()).trim();
      const href = await titleLink.getAttribute('href');
      const priceText = await card.locator('.price-new').first().innerText();

      const imgLocator = card.locator('img').first();
      const imageUrl =
        (await imgLocator.getAttribute('src')) ||
        (await imgLocator.getAttribute('data-src')) ||
        '';

      if (!href) continue;

      const url = new URL(href, BASE_URL);
      url.search = '';

      results.push({
        title,
        price: parsePolishPrice(priceText),
        url: url.toString(),
        imageUrl,
      });
    }

    return results;
  }

  async parse(page: Page): Promise<ParsedProduct> {
    // Verified from your Morele DevTools screenshots:
    const titleLocator = page
      .locator('h1[data-testid="product-name"], h1.prod-name')
      .first();
    const priceLocator = page
      .locator('[data-testid="product-price"], #product_price')
      .first();
    const imageLocator = page
      .locator('.prod-gallery .swiper-slide-active img, .prod-gallery img')
      .first();

    await priceLocator.waitFor({ state: 'visible', timeout: 10000 });

    const title = (await titleLocator.innerText()).trim();
    const priceText = await priceLocator.innerText();

    let imageUrl = '';
    try {
      imageUrl =
        (await imageLocator.getAttribute('src')) ||
        (await imageLocator.getAttribute('data-src')) ||
        '';
    } catch {
      // Optional image fallback so price tracking still succeeds
    }

    return {
      title,
      price: parsePolishPrice(priceText),
      imageUrl,
    };
  }
}
