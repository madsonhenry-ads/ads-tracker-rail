import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());
dotenv.config();

const PROXY_HOST = process.env.PRIVATEPROXY_HOST;
const PROXY_PORT = process.env.PRIVATEPROXY_PORT;
const PROXY_USER = process.env.PRIVATEPROXY_USER;
const PROXY_PASS = process.env.PRIVATEPROXY_PASS;

async function scrapePageAds(url: string, pageName: string) {
  console.log(`\n🚀 Scraping Ads for: ${pageName}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.authenticate({ username: PROXY_USER || '', password: PROXY_PASS || '' });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 10000)); // Wait for lazy load

    // Extract Ad Cards
    const ads = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[role="main"] div > div > div > div')).slice(0, 10);
      const results: any[] = [];
      
      cards.forEach(card => {
        const textElement = card.querySelector('div[dir="auto"]'); // Simplified selector for ad text
        const mediaContainer = card.querySelector('img, video');
        
        if (textElement && results.length < 3) {
          results.push({
            text: textElement.textContent?.trim(),
            media: (mediaContainer as any)?.src || 'No media found'
          });
        }
      });
      return results;
    });

    console.log(`--- RESULTS FOR ${pageName} ---`);
    console.log(JSON.stringify(ads, null, 2));

  } catch (error) {
    console.error(`Error scraping ${pageName}:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  const pages = [
    { name: "Lays Sant'anna", url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=2016271568674266" },
    { name: "Michelle Bottrel", url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=546590051870562" },
    { name: "Dra. Vanderlea Coelho", url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=137986639725842" }
  ];

  for (const p of pages) {
    await scrapePageAds(p.url, p.name);
  }
}

main();
