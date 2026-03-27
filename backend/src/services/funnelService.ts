import axios from 'axios';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import { logger } from '../utils/logger.js';

// @ts-ignore
puppeteer.use(StealthPlugin());

interface SubdomainResult {
    subdomain: string;
    source: string;
}

interface PageNode {
    url: string;
    title: string;
    screenshot?: string;
    children: PageNode[];
    externalLinks?: string[];
    redirectUrl?: string; // Capture the final after-redirect URL
}

export class FunnelService {
    /**
     * Enumerate subdomains using CRT.sh
     */
    async enumerateSubdomains(domain: string): Promise<string[]> {
        logger.info(`Enumerating subdomains for ${domain}`);
        try {
            // Remove protocol and www if present
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

            const response = await axios.get(`https://crt.sh/?q=%.${cleanDomain}&output=json`);

            if (!response.data || !Array.isArray(response.data)) {
                return [];
            }

            const subdomains = new Set<string>();
            response.data.forEach((entry: any) => {
                const nameValue = entry.name_value;
                if (nameValue) {
                    const lines = nameValue.split('\n');
                    lines.forEach((line: string) => {
                        if (line.includes(cleanDomain) && !line.includes('*')) {
                            subdomains.add(line.toLowerCase());
                        }
                    });
                }
            });

            return Array.from(subdomains).sort();
        } catch (error) {
            logger.error('Error enumerating subdomains', error);
            return [];
        }
    }

    /**
     * Recursive crawler to map funnel structure
     */
    async mapFunnel(startUrl: string, maxDepth: number = 2, headful: boolean = false): Promise<PageNode> {
        // Correctly handling potentially missing protocol
        if (!startUrl.startsWith('http')) {
            startUrl = 'https://' + startUrl;
        }

        const browser = await puppeteer.launch({
            headless: !headful,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null // Allow window resizing in headful mode
        });

        try {
            const page = await browser.newPage();

            // Advanced Stealth: Randomize User Agent & Viewport
            // Advanced Stealth: Randomize User Agent & Viewport
            // Default to mobile for stealth, but desktop for headful if preferred (keeping mobile for now to match cloak rules)
            const isMobile = !headful;

            if (isMobile) {
                await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
                await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
            } else {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
                await page.setViewport({ width: 1920, height: 1080 });
            }

            // Referrer Spoofing
            await page.setExtraHTTPHeaders({
                'Referer': 'https://l.facebook.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document'
            });

            // 3. Human Behavior (Ghost Cursor)
            const cursor = createCursor(page);

            const visited = new Set<string>();

            const crawl = async (url: string, currentDepth: number): Promise<PageNode> => {
                if (visited.has(url) || currentDepth > maxDepth) {
                    return { url, title: 'Visited/MaxDepth', children: [], externalLinks: [] };
                }
                visited.add(url);

                logger.info(`Crawling ${url} (Depth: ${currentDepth})`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                    // Simulate random interaction
                    try {
                        await cursor.move(Math.random() * 390, Math.random() * 844);
                        await cursor.click(); // Click somewhere random (safe?) or just move
                    } catch (e) {
                        // ignore cursor errors
                    }

                    // Force scroll to bottom to trigger lazy loading
                    await page.evaluate(async () => {
                        await new Promise<void>((resolve) => {
                            let totalHeight = 0;
                            const distance = 100;
                            const timer = setInterval(() => {
                                const scrollHeight = document.body.scrollHeight;
                                window.scrollBy(0, distance);
                                totalHeight += distance;

                                if (totalHeight >= scrollHeight) {
                                    clearInterval(timer);
                                    resolve();
                                }
                            }, 100);
                        });
                    });
                    // In Headful Mode, wait for user interaction to bypass cloak/captcha
                    if (headful) {
                        logger.info('Headful mode active: Waiting 30s for manual interaction...');
                        await new Promise(r => setTimeout(r, 30000));

                        // Wait for any navigation that might have been triggered by the interaction/redirect
                        try {
                            logger.info('Waiting for navigation to settle...');
                            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => logger.info('No navigation detected after delay'));
                        } catch (e) {
                            // Ignore navigation errors
                        }
                    }

                    // Ghost Cursor - Human-like movement
                    const debugPath = `debug_${Date.now()}.png`;
                    await page.screenshot({ path: debugPath });
                    logger.info(`Screenshot saved to ${debugPath}`);
                    const title = await page.title();
                    logger.info(`Title extracted: ${title}`);

                    // Simple link extraction
                    logger.info('Extracting links...');
                    // Advanced element extraction
                    logger.info('Extracting interactive elements...');

                    const pageData = await page.evaluate(() => {
                        // 1. Standard Links
                        const anchors = Array.from(document.querySelectorAll('a')).map(a => ({
                            type: 'link',
                            href: a.href,
                            text: a.innerText
                        }));

                        // 2. Buttons
                        const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
                            type: 'button',
                            text: b.innerText,
                            onclick: b.getAttribute('onclick')
                        }));

                        // 3. IFrames (Video?)
                        const iframes = Array.from(document.querySelectorAll('iframe')).map(i => ({
                            type: 'iframe',
                            src: i.src
                        }));

                        return { anchors, buttons, iframes, htmlLength: document.body.innerHTML.length };
                    });

                    logger.info(`Page Analysis: ${pageData.htmlLength} chars, ${pageData.anchors.length} links, ${pageData.buttons.length} buttons, ${pageData.iframes.length} iframes`);

                    const links = pageData.anchors
                        .map(a => a.href)
                        .filter(href => href && (href.startsWith('http') || href.startsWith('https')));
                    logger.info(`Found ${links.length} links`);

                    const domain = new URL(url).hostname;
                    const children: PageNode[] = [];

                    const internalLinks: string[] = [];
                    const externalLinks: string[] = [];

                    const uniqueLinks = Array.from(new Set(links));

                    uniqueLinks.forEach(link => {
                        try {
                            const linkHost = new URL(link).hostname;
                            if (linkHost.includes(domain) || domain.includes(linkHost)) {
                                internalLinks.push(link);
                            } else {
                                externalLinks.push(link);
                            }
                        } catch {
                            // ignore invalid urls
                        }
                    });

                    if (currentDepth < maxDepth) {
                        for (const link of internalLinks.slice(0, 5)) {
                            children.push(await crawl(link, currentDepth + 1));
                        }
                    }

                    const finalUrl = page.url();

                    return {
                        url,
                        redirectUrl: finalUrl !== url ? finalUrl : undefined,
                        title,
                        externalLinks: externalLinks.slice(0, 50), // Limit to avoid blooming
                        children
                    };

                } catch (e: any) {
                    logger.error(`Failed to crawl ${url}`, e);
                    return { url, title: `Error: ${e.message}`, children: [], externalLinks: [] };
                }
            };

            return await crawl(startUrl, 1);

        } finally {
            await browser.close();
        }
    }
}

export const funnelService = new FunnelService();
