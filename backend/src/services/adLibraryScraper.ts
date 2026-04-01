import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from '../utils/logger.js';
import { Browser, Page as PuppeteerPage } from 'puppeteer';

// @ts-ignore
puppeteer.use(StealthPlugin());

interface AdLibraryScrapeResult {
    pageId: string;
    totalAdsFound: number;
    ads: ScrapedAd[];
    insights?: {
        topUrls: { url: string; count: number }[];
        oldestDates: string[];
    };
    screenshot?: string;
}

interface ScrapedAd {
    id: string;
    ad_delivery_start_time?: string;
    ad_snapshot_url?: string;
    thumbnail_url?: string;
    isActive?: boolean;
}

export class AdLibraryScraper {

    private proxyHost = process.env.PRIVATEPROXY_HOST || '';
    private proxyPort = process.env.PRIVATEPROXY_PORT || '5432';
    private proxyUser = process.env.PRIVATEPROXY_USER || '';
    private proxyPass = process.env.PRIVATEPROXY_PASS || '';

    /**
     * Scrapes the Facebook Ad Library for a specific page using Puppeteer
     * enhanced with "Hidden Variation" discovery logic.
     */
    async scrapePageAds(pageId: string): Promise<AdLibraryScrapeResult> {
        logger.info(`🕵️‍♀️ Starting Deep Scrape for page: ${pageId}`);

        // Construct URL with filters for maximum visibility
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

        const launchArgs = [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--single-process'
        ];

        let executablePath: string | undefined = undefined;

        // Auto-detect Chrome binary for Linux (Railway/Nixpacks)
        if (process.platform === 'linux') {
            const fs = await import('fs');
            const commonPaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium'
            ];
            
            for (const path of commonPaths) {
                if (fs.existsSync(path)) {
                    executablePath = path;
                    logger.info(`🧭 Found system browser at: ${executablePath}`);
                    break;
                }
            }
        }

        if (this.proxyHost) {
            const proxyUrl = `${this.proxyHost}:${this.proxyPort}`;
            launchArgs.push(`--proxy-server=http://${proxyUrl}`);
            logger.info(`🌐 Using proxy: ${proxyUrl}`);
        }

        const launchOptions: any = {
            headless: true,
            args: launchArgs,
            defaultViewport: { width: 1280, height: 800 }
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        const browser = await (puppeteer as any).launch(launchOptions);

        try {
            const page = await browser.newPage();

            if (this.proxyUser && this.proxyPass) {
                await page.authenticate({ username: this.proxyUser, password: this.proxyPass });
            }

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' });

            logger.info(`🚀 Navigating to Ad Library...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Initial wait and verify blockage
            await new Promise(r => setTimeout(r, 5000));
            const content = await page.content();
            if (content.includes('temporarily blocked') || content.includes('Log In')) {
                logger.warn('⚠️ Potential block detected. Attempting to proceed...');
            }

            // 1. Scroll to load initial batch of ads
            logger.info('📜 Scrolling to load ads...');
            await page.evaluate(async () => {
                for (let i = 0; i < 5; i++) {
                    window.scrollBy(0, 1000);
                    await new Promise(r => setTimeout(r, 1000));
                }
            });

            // 2. Find and Click "See Summary Details" (Ver detalhes do resumo) buttons
            logger.info('🔍 Looking for hidden variations (See Summary Details)...');

            // Get all summary buttons handles
            const summaryButtons = await page.evaluateHandle(() => {
                return Array.from(document.querySelectorAll('div[role="button"], span[role="button"]'))
                    .filter(el => {
                        const text = el.textContent?.toLowerCase() || '';
                        return text.includes('ver detalhes do resumo') ||
                            text.includes('see summary details') ||
                            text.includes('ver resumo');
                    });
            });

            const buttonCount = await page.evaluate(handles => handles.length, summaryButtons);
            logger.info(`🔘 Found ${buttonCount} grouped ad buttons.`);

            const collectedAds = new Map<string, ScrapedAd>();

            // Helper to scrape visible Ads with Details (Date, Image)
            const scrapeAdsDetails = async (): Promise<ScrapedAd[]> => {
                return page.evaluate(() => {
                    const ads: any[] = [];
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent || '';
                        // Matches "ID: 12345"
                        const match = text.match(/(?:ID|Identificação|Biblioteca)[:\s]+(\d{10,})/i);

                        if (match) {
                            const id = match[1];
                            let container = node.parentElement;
                            let cardRoot = container;

                            // Traverse up to find the ad card container
                            // Usually ~5-7 levels up is the main card wrapper
                            // We look for a container that has substantial height or specific structure
                            for (let i = 0; i < 7; i++) {
                                if (cardRoot?.parentElement) cardRoot = cardRoot.parentElement;
                            }

                            if (!cardRoot) continue;

                            // 1. Extract Date
                            let startDate = '';
                            // Added "Veiculação iniciada em" and broader match for PT/ES/EN
                            const dateRegex = /(?:Started running on|Veiculação iniciada em|Veiculado a partir de|En circulación desde|Ativo desde|Active since)[\s:]+([^•\n]+)/i;
                            const innerText = cardRoot.innerText || '';
                            const dateMatch = innerText.match(dateRegex);

                            if (dateMatch) {
                                const rawDate = dateMatch[1].trim(); // e.g. "29 de jan de 2026"

                                // Helper to parse PT/EN dates to YYYY-MM-DD
                                try {
                                    // Remove "de " or "," and split
                                    const cleanParts = rawDate.replace(/,|de /g, ' ').split(/\s+/).filter(p => p);
                                    if (cleanParts.length >= 3) {
                                        const day = parseInt(cleanParts[0]);
                                        const monthStr = cleanParts[1].toLowerCase().substring(0, 3);
                                        const year = parseInt(cleanParts[2]);

                                        const monthMap: { [key: string]: number } = {
                                            'jan': 0, 'fev': 1, 'feb': 1, 'mar': 2, 'abr': 3, 'apr': 3,
                                            'mai': 4, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'aug': 7,
                                            'set': 8, 'sep': 8, 'out': 9, 'oct': 9, 'nov': 10, 'dez': 11, 'dec': 11
                                        };

                                        if (!isNaN(day) && !isNaN(year) && monthMap.hasOwnProperty(monthStr)) {
                                            const dateObj = new Date(year, monthMap[monthStr], day);
                                            // Handle local time to ISO date part
                                            const offset = dateObj.getTimezoneOffset() * 60000;
                                            const localISODate = new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
                                            startDate = localISODate;
                                        } else {
                                            // Fallback for standard formats if JS can parse it directly
                                            const directParse = new Date(rawDate);
                                            if (!isNaN(directParse.getTime())) {
                                                startDate = directParse.toISOString();
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Keep empty or raw if parse fails
                                }
                            }

                            // 2. Extract Image
                            let thumbnailUrl = '';
                            // Try to find the main ad image
                            // Usually the largest image in the card
                            const images = Array.from(cardRoot.querySelectorAll('img'));
                            let bestImg = null;
                            let maxArea = 0;

                            for (const img of images) {
                                const rect = (img as HTMLElement).getBoundingClientRect();
                                const area = rect.width * rect.height;
                                // Ignore tiny icons (like spacers or logos < 50x50)
                                if (area > 2500 && area > maxArea) {
                                    maxArea = area;
                                    bestImg = img;
                                }
                            }

                            if (bestImg) {
                                thumbnailUrl = (bestImg as HTMLImageElement).src;
                            } else {
                                // Fallback: try video poster
                                const video = cardRoot.querySelector('video');
                                if (video && video.poster) {
                                    thumbnailUrl = video.poster;
                                }
                            }

                            ads.push({
                                id,
                                ad_delivery_start_time: startDate,
                                ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`,
                                thumbnail_url: thumbnailUrl,
                                isActive: true
                            });
                        }
                    }
                    return ads;
                });
            };

            // Scrape main page first
            const initialAds = await scrapeAdsDetails();
            initialAds.forEach(ad => {
                if (!collectedAds.has(ad.id)) {
                    collectedAds.set(ad.id, ad);
                }
            });

            // Iterate and click summary buttons
            if (buttonCount > 0) {
                for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Limit to 10 groups to save time
                    try {
                        logger.info(`🔓 Expanding group ${i + 1}/${buttonCount}...`);

                        // Re-query element because DOM changes might detach handles
                        await page.evaluate((index) => {
                            const btns = Array.from(document.querySelectorAll('div[role="button"], span[role="button"]'))
                                .filter(el => {
                                    const text = el.textContent?.toLowerCase() || '';
                                    return text.includes('ver detalhes') || text.includes('see summary');
                                });
                            if (btns[index]) (btns[index] as HTMLElement).click();
                        }, i);

                        await new Promise(r => setTimeout(r, 3000)); // Wait for modal

                        // Scrape IDs from Modal
                        const modalAds = await scrapeAdsDetails();
                        modalAds.forEach(ad => collectedAds.set(ad.id, ad));
                        logger.info(`   Found ${modalAds.length} ads in this group.`);

                        // Close Modal (Press Escape)
                        await page.keyboard.press('Escape');
                        await new Promise(r => setTimeout(r, 1000));

                    } catch (e) {
                        logger.warn(`Failed to expand group ${i}: ${e}`);
                    }
                }
            }

            // 3. Final Compilation
            logger.info(`✅ Total Unique IDs found: ${collectedAds.size}`);
            const resultArray: ScrapedAd[] = Array.from(collectedAds.values());

            // 4. Extract Insights (Top URLs and Oldest Dates)
            logger.info('📊 Extracting Insights...');
            const insightsData = await page.evaluate(() => {
                const dateElements = Array.from(document.querySelectorAll('span')).filter(el =>
                    el.innerText.includes('Started running on') ||
                    el.innerText.includes('Veiculação iniciada em') ||
                    el.innerText.includes('Começou a ser veiculado em') ||
                    el.innerText.includes('Started running') ||
                    el.innerText.includes('Começou a') ||
                    el.innerText.includes('Veiculado a partir de') ||
                    el.innerText.includes('Active since') ||
                    el.innerText.includes('Ativo desde')
                );

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

            const oldestDates = [...new Set(insightsData.dates as string[])].sort().slice(0, 10);
            const linkCounts: Record<string, number> = {};
            for (const link of (insightsData.links as string[])) {
                try {
                    const url = new URL(link);
                    const baseUrl = url.origin + url.pathname;
                    linkCounts[baseUrl] = (linkCounts[baseUrl] || 0) + 1;
                } catch (e) {
                    // ignore
                }
            }
            const topUrls = Object.entries(linkCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([url, count]) => ({ url, count }));

            // Take screenshot for debug
            const screenshot = await page.screenshot({ encoding: 'base64' });

            return {
                pageId,
                totalAdsFound: resultArray.length,
                ads: resultArray,
                insights: {
                    topUrls,
                    oldestDates
                },
                screenshot: screenshot as string
            };

        } catch (error: any) {
            logger.error(`❌ Deep Scraping failed: ${error.message}`);
            console.error('SCRAPE_ERROR_STACK:', error);
            // Write to file for debugging
            try {
                const fs = await import('fs');
                const path = await import('path');
                const debugPath = path.join(process.cwd(), 'scrape_debug_absolute.txt');
                fs.writeFileSync(debugPath, `Error at ${new Date().toISOString()}:\n${error.stack || error.message}\n`);
            } catch (fsError) {
                console.error('Failed to write error log', fsError);
            }
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }
}

export const adLibraryScraper = new AdLibraryScraper();
