import { Page } from 'playwright';
import { StoreParser } from './store-parser.inteface';
import { parsePolishPrice } from 'src/utils/price.parser';

export class XkomParser implements StoreParser {
  matches(url: string): boolean {
    return url.includes('x-kom.pl');
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
