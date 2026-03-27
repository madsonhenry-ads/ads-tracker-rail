import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const AD_URL = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&source=page-transparency-widget&view_all_page_id=102507296211697';

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            let scrolls = 0;
            const maxScrolls = 30; // 30 scrolls * 500 = 15000px
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;

                if (totalHeight >= scrollHeight || scrolls >= maxScrolls) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });
    });
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

        console.log('Scrolling down to load ads limit...');
        await autoScroll(page);
        await new Promise(r => setTimeout(r, 3000));

        console.log('Extracting ads data...');
        const adsData = await page.evaluate(() => {

            // Extract text that has started running phrase
            const dateElements = Array.from(document.querySelectorAll('span')).filter(el =>
                el.innerText.includes('Started running on') ||
                el.innerText.includes('Começou a ser veiculado em') ||
                el.innerText.includes('Started running') ||
                el.innerText.includes('Começou a')
            );

            // Extract external links inside ads
            const allLinks = Array.from(document.querySelectorAll('a'))
                .map(a => {
                    let href = a.href;
                    if (href && href.includes('l.facebook.com/l.php?u=')) {
                        try {
                            href = decodeURIComponent(new URL(href).searchParams.get('u') || '');
                        } catch (e) { }
                    }
                    return href;
                })
                .filter(href => href && href.startsWith('http') && !href.includes('facebook.com') && !href.includes('fb.com'));

            const dates = dateElements.map(el => el.innerText.trim());

            return { dates, links: allLinks };
        });

        console.log('--- Extracted Data ---');
        console.log('Total ads dates found:', adsData.dates.length);
        console.log('Oldest dates reported:', [...new Set(adsData.dates)].sort());

        const linkCounts: Record<string, number> = {};
        for (const link of adsData.links) {
            try {
                const url = new URL(link);
                const baseUrl = url.origin + url.pathname;
                linkCounts[baseUrl] = (linkCounts[baseUrl] || 0) + 1;
            } catch (e) {
                // ignore
            }
        }

        const sortedLinks = Object.entries(linkCounts).sort((a, b) => b[1] - a[1]);
        console.log('\nTop 10 Targeted URLs:');
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
