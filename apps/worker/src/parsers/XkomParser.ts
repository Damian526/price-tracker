import { Page } from 'playwright';
import { StoreParser } from './store-parser.inteface';
import { parsePolishPrice } from 'src/utils/price.parser';

export class XkomParser implements StoreParser {
  matches(url: string): boolean {
    return url.includes('x-kom.pl');
  }
  async parse(page: Page) {
    // check actual site and found how to scrape page

    const titleLocator = page.locator('h1'); // some example selector, change to real selector
    const priceLocator = page.locator('div[class*="price"]');
    const title = await titleLocator.first().innerText();
    const priceText = await priceLocator.first().innerText();

    return {
      title,
      price: parsePolishPrice(priceText),
    };
  }
}
