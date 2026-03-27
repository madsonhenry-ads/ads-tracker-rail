import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const AD_URL = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&source=page-transparency-widget&view_all_page_id=102507296211697';

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });
    });
}

function extractDate(dateString: string): Date | null {
    // Example: "Started running on 4 Mar 2025" or "Começou a ser veiculado em 4 de mar. de 2025"
    // Just returning the string for now since parsing multiple languages is tricky, we can sort it later or print them.
    return null;
}

async function main() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log(`Navigating to ${AD_URL}...`);
        await page.goto(AD_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Waiting for content to load...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('Scrolling down to load all ads...');
        await autoScroll(page);
        await new Promise(r => setTimeout(r, 3000));

        console.log('Extracting ads data...');
        const adsData = await page.evaluate(() => {
            const ads = Array.from(document.querySelectorAll('div.x1y1aw1k.xwib8y2.xudqn12')); // Card container class might vary, let's just query everything inside the main container or find common text.

            // Strategy: Find all "Started running on" or "Começou a ser veiculado em"
            const dateElements = Array.from(document.querySelectorAll('span')).filter(el =>
                el.innerText.includes('Started running on') ||
                el.innerText.includes('Começou a ser veiculado em') ||
                el.innerText.includes('Started running') ||
                el.innerText.includes('Começou a')
            );

            // Strategy: Find all links that go outside facebook (usually buttons like "Learn More", "Shop Now" have a href)
            const allLinks = Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http') && !href.includes('facebook.com') && !href.includes('fb.com'));

            // Let's get the specific dates
            const dates = dateElements.map(el => el.innerText.trim());

            return {
                dates,
                links: allLinks
            };
        });

        console.log('--- Extracted Data ---');
        console.log('Total ads dates found:', adsData.dates.length);
        console.log('Oldest dates reported:', [...new Set(adsData.dates)]);

        const linkCounts: Record<string, number> = {};
        for (const link of adsData.links) {
            // Remove tracking params for counting
            try {
                const url = new URL(link);
                const baseUrl = url.origin + url.pathname;
                linkCounts[baseUrl] = (linkCounts[baseUrl] || 0) + 1;
            } catch (e) {
                // ignore invalid urls
            }
        }

        const sortedLinks = Object.entries(linkCounts).sort((a, b) => b[1] - a[1]);
        console.log('\nTop 10 Targeted URLs (ignoring query params):');
        for (const [link, count] of sortedLinks.slice(0, 10)) {
            console.log(`- ${link}: ${count} times`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

main();
