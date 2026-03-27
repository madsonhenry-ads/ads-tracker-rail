import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());

async function inspectSite() {
    const url = 'https://stalkea.ai/inicio4';

    console.log(`Starting inspection of ${url}...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        defaultViewport: null,
    });

    try {
        const page = await browser.newPage();

        // Emulate Mobile Device
        await page.setUserAgent(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
        );
        await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

        // Spoof Facebook Referrer
        await page.setExtraHTTPHeaders({
            'Referer': 'https://l.facebook.com/',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
        });

        // Track Requests for API Keys
        const requests: { url: string, postData?: string }[] = [];
        page.on('request', req => {
            requests.push({ url: req.url(), postData: req.postData() });
        });

        console.log('Navigating to URL...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Simulate Human
        try {
            const cursor = createCursor(page);
            await cursor.moveTo({ x: Math.random() * 300 + 50, y: Math.random() * 400 + 100 });
            await new Promise(r => setTimeout(r, 1000));
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let scrolled = 0;
                    const interval = setInterval(() => {
                        window.scrollBy(0, 100);
                        scrolled += 100;
                        if (scrolled >= document.body.scrollHeight * 0.5) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 200);
                });
            });
        } catch (e) { }

        await new Promise(r => setTimeout(r, 5000)); // wait a bit more

        // Search for keys in HTML and Scripts
        console.log('Scanning DOM for API Keys...');
        const html = await page.content();

        fs.writeFileSync('stalkea_html.txt', html);

        const apiPatterns = [
            /sk-[a-zA-Z0-9]{48}/g, // OpenAI
            /AIza[0-9A-Za-z-_]{35}/g, // Google
            /SG\.[a-zA-Z0-9_-]{22,}/g, // SendGrid
            /key-[0-9a-zA-Z]{32}/g, // Mailgun
            /[a-zA-Z0-9]{32}/g, // Some generic MD5-like hashes could be keys
        ];

        let foundKeys: string[] = [];

        for (const pattern of apiPatterns) {
            const matches = html.match(pattern);
            if (matches) foundKeys.push(...matches);
        }

        // Also check requests
        for (const req of requests) {
            if (req.url.includes('api') || req.url.includes('graphql') || req.url.includes('key=') || req.url.includes('token=')) {
                // simple check
                const u = new URL(req.url);
                for (const [key, val] of u.searchParams) {
                    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
                        foundKeys.push(`In Request ${req.url}: ${val}`);
                    }
                }
            }
        }

        const uniqueKeys = [...new Set(foundKeys)];
        console.log('\n--- Extraction Complete ---');
        console.log(`Final URL: ${page.url()}`);
        console.log(`Potential Keys Found: ${uniqueKeys.length}`);
        uniqueKeys.forEach(k => console.log(k));

        // Let's also grab any inline JSON or script contents explicitly
        const scripts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('script')).map(s => s.innerText).filter(s => s.trim().length > 0);
        });

        let i = 0;
        scripts.forEach(script => {
            for (const pattern of apiPatterns) {
                const matches = script.match(pattern);
                if (matches) {
                    matches.forEach(m => uniqueKeys.push(m));
                }
            }
            fs.writeFileSync(`stalkea_script_${i++}.js`, script);
        });

        // Search for 'sk-' manually just in case
        console.log('\n--- Raw Search for "sk-" ---');
        if (html.includes('sk-')) {
            const idx = html.indexOf('sk-');
            console.log(html.substring(Math.max(0, idx - 50), idx + 100));
        } else {
            console.log('No "sk-" found explicitly.');
        }

    } catch (err) {
        console.error('Error during inspection:', err);
    } finally {
        await browser.close();
    }
}

inspectSite();
