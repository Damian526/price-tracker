import { readFileSync } from 'fs';
import { join } from 'path';
import { chromium, Browser, Page } from 'playwright';
import { XkomParser } from './XkomParser';

// Offline test: runs the real parser against a saved snapshot of x-kom search
// results, so it is deterministic and needs no network access.
describe('XkomParser (fixture)', () => {
  const html = readFileSync(
    join(__dirname, '__fixtures__', 'xkom-search.html'),
    'utf8',
  );
  let browser: Browser;
  let page: Page;
  let parser: XkomParser;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    parser = new XkomParser();
  });

  beforeEach(async () => {
    await page.setContent(html);
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('getSearchUrl', () => {
    it('builds a search url and encodes the query', () => {
      expect(parser.getSearchUrl('myszka')).toBe(
        'https://www.x-kom.pl/szukaj?q=myszka',
      );
      expect(parser.getSearchUrl('iPhone 15 & case')).toBe(
        'https://www.x-kom.pl/szukaj?q=iPhone%2015%20%26%20case',
      );
    });
  });

  describe('parseSearchResults', () => {
    it('returns at most 3 results by default', async () => {
      const results = await parser.parseSearchResults(page);
      expect(results).toHaveLength(3);
    });

    it('respects a custom limit', async () => {
      expect(await parser.parseSearchResults(page, 1)).toHaveLength(1);
      expect(await parser.parseSearchResults(page, 10)).toHaveLength(4);
    });

    it('extracts title, price and absolute url of each product', async () => {
      const [first, second] = await parser.parseSearchResults(page);

      expect(first).toEqual({
        title: 'Logitech MX Master 4 Grafit',
        price: 499,
        url: 'https://www.x-kom.pl/p/1365779-myszka-bezprzewodowa-logitech-mx-master-4-grafit.html',
      });
      expect(second.title).toBe('SMX Bonobo V2 Super Void black');
      expect(second.price).toBe(119.99);
    });

    it('strips tracking params from product urls', async () => {
      const results = await parser.parseSearchResults(page, 10);
      for (const { url } of results) {
        expect(url).not.toContain('?');
      }
    });
  });
});
