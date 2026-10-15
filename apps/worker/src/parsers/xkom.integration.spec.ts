import { chromium, Browser, Page } from 'playwright';
import { XkomParser } from './XkomParser';

// Live smoke test against the real x-kom.pl. It depends on the network,
// bot protection and the current DOM, so it is skipped unless explicitly
// requested:  LIVE_TESTS=1 npm test -- xkom.integration
// Use it to detect when x-kom changes its markup (then refresh the fixture
// in __fixtures__/ and fix the selectors in XkomParser).
const describeLive = process.env.LIVE_TESTS ? describe : describe.skip;

describeLive('XkomParser (live)', () => {
  let browser: Browser;
  let page: Page;
  let parser: XkomParser;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    parser = new XkomParser();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should successfully scrape live search results for "myszka"', async () => {
    await page.goto(parser.getSearchUrl('myszka'), {
      waitUntil: 'domcontentloaded',
    });

    const results = await parser.parseSearchResults(page);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);

    const firstItem = results[0];
    expect(firstItem.title.length).toBeGreaterThan(0);
    expect(typeof firstItem.price).toBe('number');
    expect(firstItem.price).toBeGreaterThan(0);
    expect(firstItem.url).toContain('https://www.x-kom.pl');
  }, 30000);
});
