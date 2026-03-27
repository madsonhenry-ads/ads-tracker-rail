
import puppeteer from 'puppeteer';

const AD_URL = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&id=871956752277569&view_all_page_id=166629596540078';

async function main() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log(`Navigating to ${AD_URL}...`);
        await page.goto(AD_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Waiting for content...');
        await new Promise(r => setTimeout(r, 5000));

        // Take a screenshot to debug if needed (saved to current dir)
        // await page.screenshot({ path: 'debug_ad.png' });

        // Try to extract media
        const media = await page.evaluate(() => {
            const results = {
                images: [] as string[],
                videos: [] as string[],
                iframes: [] as string[],
                backgroundImages: [] as string[]
            };

            // 1. Direct Video tags
            document.querySelectorAll('video').forEach(v => {
                if (v.src) results.videos.push(v.src);
                v.querySelectorAll('source').forEach(s => {
                    if (s.src) results.videos.push(s.src);
                });
            });

            // 2. Images
            document.querySelectorAll('img').forEach(img => {
                if (img.src && img.src.includes('fbcdn')) {
                    results.images.push(img.src);
                }
            });

            // 3. Divs with background images
            document.querySelectorAll('div').forEach(div => {
                const style = window.getComputedStyle(div);
                const bg = style.backgroundImage;
                if (bg && bg !== 'none' && bg.includes('url')) {
                    results.backgroundImages.push(bg);
                }
            });

            return results;
        });

        console.log('--- Extracted Media ---');
        console.log('VIDEOS:', JSON.stringify(media.videos, null, 2));
        console.log('IMAGES:', JSON.stringify(media.images, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

main();
