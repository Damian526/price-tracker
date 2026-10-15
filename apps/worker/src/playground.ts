import { chromium } from 'playwright';
import { XkomParser } from './parsers/XkomParser';

async function testScraper() {
  console.log('Launching browser...');
  // headless: false means you will actually see the Chrome window open
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const parser = new XkomParser();
  const searchUrl = parser.getSearchUrl('iPhone 15');

  console.log(`Visiting: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

  console.log('Extracting data...');
  const results = await parser.parseSearchResults(page);

  console.log('\n--- SCRAPE RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  console.log('\nClosing browser in 3 seconds...');
  await new Promise((res) => setTimeout(res, 3000));
  await browser.close();
}

testScraper().catch(console.error);
