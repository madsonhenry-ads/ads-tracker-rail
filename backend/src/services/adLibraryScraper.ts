import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// @ts-ignore
puppeteerExtra.use(StealthPlugin());

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
    creative_body?: string;
    creative_title?: string;
    creative_link?: string;
}

interface ScrapeOptions {
    country?: string;
    activeStatus?: 'active' | 'inactive' | 'all';
}

export class AdLibraryScraper {

    private proxyHost = process.env.PRIVATEPROXY_HOST || '';
    private proxyPort = process.env.PRIVATEPROXY_PORT || '5432';
    private proxyUser = process.env.PRIVATEPROXY_USER || '';
    private proxyPass = process.env.PRIVATEPROXY_PASS || '';

    async scrapePageAds(pageId: string, options: ScrapeOptions = {}): Promise<AdLibraryScrapeResult> {
        const { country = 'ALL', activeStatus = 'active' } = options;

        logger.info(`🕵️‍♀️ [Deep Scrape] Iniciando para página: ${pageId} (country: ${country}, status: ${activeStatus})`);

        const activeParam = activeStatus === 'all' ? 'all' : activeStatus;
        const url = `https://www.facebook.com/ads/library/?active_status=${activeParam}&ad_type=all&country=${country}&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

        // Try desktop first (mobile viewport often causes redirects/problems on Ad Library)
        // Then mobile as fallback
        const strategies = [
            { label: '💻 Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', width: 1920, height: 1080, mobile: false },
            { label: '📱 Mobile', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', width: 390, height: 844, mobile: true },
        ];

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < strategies.length; attempt++) {
            const s = strategies[attempt];
            const useProxy = attempt >= 1 && !!this.proxyHost;
            logger.info(`🎯 Tentativa ${attempt + 1}/${strategies.length}: ${s.label}${useProxy ? ' + proxy' : ''}`);

            try {
                const result = await this.scrapeWithViewport(pageId, url, s, useProxy);
                if (result.totalAdsFound > 0) {
                    logger.info(`✅ [Deep Scrape] Sucesso tentativa ${attempt + 1}: ${result.totalAdsFound} anúncios`);
                    return result;
                }
                logger.warn(`⚠️ Tentativa ${attempt + 1} retornou 0 anúncios`);
            } catch (error: any) {
                lastError = error;
                logger.warn(`⚠️ Tentativa ${attempt + 1} falhou: ${error.message}`);
            }
        }

        throw lastError || new Error('All scraping strategies returned 0 ads');
    }

    private async scrapeWithViewport(
        pageId: string, url: string, s: { label: string; ua: string; width: number; height: number; mobile: boolean },
        useProxy: boolean,
    ): Promise<AdLibraryScrapeResult> {
        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--single-process',
            '--lang=pt-BR',
        ];

        let executablePath: string | undefined;
        if (process.platform === 'linux') {
            const paths = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
            for (const p of paths) { if (fs.existsSync(p)) { executablePath = p; logger.info(`🧭 Chrome: ${p}`); break; } }
        }

        if (useProxy && this.proxyHost) {
            launchArgs.push(`--proxy-server=http://${this.proxyHost}:${this.proxyPort}`);
        }

        const browser = await (puppeteerExtra as any).launch({
            headless: true,
            args: launchArgs,
            executablePath,
            defaultViewport: null,
        });

        try {
            const page = await browser.newPage();

            if (useProxy && this.proxyUser && this.proxyPass) {
                await page.authenticate({ username: this.proxyUser, password: this.proxyPass });
            }

            // Viewport + UA
            await page.setUserAgent(s.ua);
            await page.setViewport({ width: s.width, height: s.height, isMobile: s.mobile, hasTouch: s.mobile, deviceScaleFactor: s.mobile ? 3 : 1 });

            // Facebook referrer + headers
            await page.setExtraHTTPHeaders({
                'Referer': 'https://l.facebook.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            });

            // Webdriver bypass + navigator spoofing
            await page.evaluateOnNewDocument(() => {
                // @ts-ignore
                delete Object.getPrototypeOf(navigator).webdriver;
                // @ts-ignore
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                // @ts-ignore
                Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
            });

            // --- Network interception: ONLY block analytics/tracking, NOT stylesheets/images ---
            const apiResponses: any[] = [];

            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const url = req.url();
                const type = req.resourceType();
                // Only block things that are definitely not needed
                if (type === 'font' && url.includes('static.xx.fbcdn.net')) {
                    req.abort();
                } else if (type === 'image' && url.includes('static.xx.fbcdn.net') && !url.includes('emoji')) {
                    req.continue(); // Actually, let images through — we need thumbnails
                    // But let's abort tracking-only things
                } else if (url.includes('analytics') || url.includes('log')) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Capture ALL API/JSON responses, not just graphql
            page.on('response', async (response) => {
                const respUrl = response.url();
                const contentType = response.headers()['content-type'] || '';
                if (contentType.includes('json') || respUrl.includes('/api/') || respUrl.includes('graphql')) {
                    try {
                        const json = await response.json();
                        if (json) apiResponses.push(json);
                    } catch { /* not json */ }
                }
            });

            // --- Navigate ---
            logger.info(`🚀 [Deep Scrape] Navegando... (${s.label})`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

            // Wait specifically for ad content or at least for the page to stabilize
            logger.info(`⏳ [Deep Scrape] Aguardando render (15s)...`);

            // Try to wait for ad-related selectors first, then fallback to timeout
            try {
                await page.waitForSelector('a[href*="ads/library"]', { timeout: 10000 });
                logger.info(`   ✅ Selector de anúncio encontrado!`);
            } catch {
                logger.info(`   ⏭️ Selector não encontrado, aguardando mais...`);
                await new Promise(r => setTimeout(r, 12000));
            }

            // Check for blockage
            const pageContent = await page.content();
            const lower = pageContent.toLowerCase();
            if (lower.includes('temporarily blocked') || lower.includes('log in') || lower.includes('entrar') || lower.includes('login')) {
                logger.warn(`⚠️ [Deep Scrape] Possível bloqueio!`);
                const screenshot = await page.screenshot({ encoding: 'base64' });
                logger.info(`📸 Screenshot: ${(screenshot as string).length} chars`);
            }

            // Log page title and URL to understand where we landed
            const currentUrl = page.url();
            const title = await page.title();
            logger.info(`   📍 URL atual: ${currentUrl}`);
            logger.info(`   📍 Título: ${title}`);

            // --- Scroll the page smoothly to load lazy content ---
            logger.info(`📜 [Deep Scrape] Rolando página...`);

            // Try ghost-cursor first
            try {
                const cursor = createCursor(page);
                await cursor.moveTo({ x: 300 + Math.random() * 200, y: 400 + Math.random() * 200 });
                await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
            } catch { /* ghost-cursor not available */ }

            // Scroll in smaller steps with more delay to let ads load
            await page.evaluate(async () => {
                const totalHeight = Math.max(document.body.scrollHeight, 3000);
                const steps = 15;
                for (let i = 0; i < steps; i++) {
                    window.scrollTo(0, (totalHeight / steps) * (i + 1));
                    await new Promise(r => setTimeout(r, 1500 + Math.random() * 500));
                }
                // Scroll back up to trigger any "sticky" loading
                window.scrollTo(0, 0);
                await new Promise(r => setTimeout(r, 1000));
                // And down again
                for (let i = 0; i < steps; i++) {
                    window.scrollTo(0, (totalHeight / steps) * (i + 1));
                    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
                }
            });

            await new Promise(r => setTimeout(r, 3000));

            // Log how many API responses we captured
            logger.info(`   📦 Respostas JSON capturadas: ${apiResponses.length}`);

            // --- EXTRACTION STRATEGY 1: Parse API/GraphQL responses ---
            logger.info(`🔍 [Deep Scrape] Estratégia 1: API responses (${apiResponses.length})...`);
            const adsFromApi = this.extractAdsFromJson(apiResponses);
            logger.info(`   📊 API: ${adsFromApi.length} anúncios`);

            if (adsFromApi.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: adsFromApi.length, ads: adsFromApi, insights, screenshot: screenshot as string };
            }

            // --- EXTRACTION STRATEGY 2: DOM extraction ---
            logger.info(`🔍 [Deep Scrape] Estratégia 2: DOM...`);
            const domAds = await this.extractAdsFromDom(page);
            logger.info(`   📊 DOM: ${domAds.length} anúncios`);

            if (domAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: domAds.length, ads: domAds, insights, screenshot: screenshot as string };
            }

            // --- EXTRACTION STRATEGY 3: HTML regex ---
            logger.info(`🔍 [Deep Scrape] Estratégia 3: HTML regex...`);
            const htmlAds = this.extractAdsFromHtml(pageContent);
            logger.info(`   📊 HTML: ${htmlAds.length} anúncios`);

            if (htmlAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: htmlAds.length, ads: htmlAds, insights, screenshot: screenshot as string };
            }

            // --- EXTRACTION STRATEGY 4: Try evaluating page for any JSON data in script tags ---
            logger.info(`🔍 [Deep Scrape] Estratégia 4: Script tags...`);
            const scriptAds = await this.extractAdsFromScripts(page);
            logger.info(`   📊 Scripts: ${scriptAds.length} anúncios`);

            if (scriptAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: scriptAds.length, ads: scriptAds, insights, screenshot: screenshot as string };
            }

            logger.warn(`⚠️ [Deep Scrape] Nenhum anúncio encontrado.`);
            const screenshot = await page.screenshot({ encoding: 'base64' });
            return { pageId, totalAdsFound: 0, ads: [], screenshot: screenshot as string };

        } catch (error: any) {
            logger.error(`❌ [Deep Scrape] Falha: ${error.message}`);
            throw error;
        } finally {
            await browser.close().catch(() => { });
        }
    }

    /**
     * Extract ads from JSON API responses by recursively searching for ad-like objects
     */
    private extractAdsFromJson(responses: any[]): ScrapedAd[] {
        const adsMap = new Map<string, ScrapedAd>();
        const seenIds = new Set<string>();

        const traverse = (obj: any, depth = 0) => {
            if (!obj || depth > 25 || typeof obj !== 'object') return;

            // Look for objects that have both an ID (9+ digits) AND an ad_snapshot_url
            if (obj.id && typeof obj.id === 'string' && obj.id.match(/^\d{9,}$/)) {
                const hasAdField = obj.ad_snapshot_url || obj.creative_body || obj.ad_creative_body ||
                    obj.creation_time || obj.ad_delivery_start_time || obj.thumbnail_url;

                if (hasAdField && !seenIds.has(obj.id)) {
                    seenIds.add(obj.id);
                    adsMap.set(obj.id, {
                        id: obj.id,
                        ad_snapshot_url: obj.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${obj.id}`,
                        creative_body: obj.creative_body || obj.ad_creative_body || obj.body || '',
                        creative_title: obj.creative_title || obj.title || '',
                        ad_delivery_start_time: obj.ad_delivery_start_time || obj.creation_time || '',
                        thumbnail_url: obj.thumbnail_url || obj.thumbnail || '',
                        isActive: true,
                    });
                }
            }
            // Also catch IDs that are numbers
            if (obj.id && typeof obj.id === 'number' && obj.id.toString().match(/^\d{9,}$/)) {
                const id = obj.id.toString();
                const hasAdField = obj.ad_snapshot_url || obj.creative_body || obj.thumbnail_url;
                if (hasAdField && !seenIds.has(id)) {
                    seenIds.add(id);
                    adsMap.set(id, {
                        id,
                        ad_snapshot_url: obj.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${id}`,
                        creative_body: obj.creative_body || '',
                        thumbnail_url: obj.thumbnail_url || '',
                        isActive: true,
                    });
                }
            }

            // Also look for arrays of items that might be ad collections
            if (Array.isArray(obj)) {
                for (const item of obj) traverse(item, depth + 1);
            } else {
                for (const key of Object.keys(obj)) {
                    try { traverse(obj[key], depth + 1); } catch { }
                }
            }
        };

        for (const resp of responses) traverse(resp);

        // Also try a broader search: look for any node that has an array with ad-like items
        const broadSearch = (obj: any, depth = 0) => {
            if (!obj || depth > 20 || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    if (item && typeof item === 'object' && item.id) {
                        const id = String(item.id);
                        if (id.match(/^\d{9,}$/) && !seenIds.has(id)) {
                            // Check if this item is adjacent to other ad-like items
                            seenIds.add(id);
                            adsMap.set(id, {
                                id,
                                ad_snapshot_url: item.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${id}`,
                                creative_body: item.creative_body || item.body || '',
                                ad_delivery_start_time: item.ad_delivery_start_time || item.start_time || item.creation_time || '',
                                thumbnail_url: item.thumbnail_url || item.thumbnail || '',
                                isActive: true,
                            });
                        }
                    }
                }
            }
            if (typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                    try { broadSearch(obj[key], depth + 1); } catch { }
                }
            }
        };
        for (const resp of responses) broadSearch(resp);

        return Array.from(adsMap.values());
    }

    /**
     * Extract ads from the rendered DOM
     */
    private async extractAdsFromDom(page: any): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate(() => {
                const ads: any[] = [];
                const seenIds = new Set<string>();

                // Broader selectors to find ad links
                const selectors = [
                    'a[href*="/ads/library"]',
                    'a[href*="ad_library"]',
                    'a[href*="adlibrary"]',
                    'a[href*="/ads/about"]',
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const el of Array.from(elements)) {
                        const href = el.getAttribute('href') || (el as any).href || '';
                        const match = href.match(/[?&]id=(\d{9,})/);
                        if (match && !seenIds.has(match[1])) {
                            seenIds.add(match[1]);
                            const id = match[1];
                            let container = el.closest('[role="article"]') || el.closest('[data-pagelet]') || el.parentElement;
                            if (!container || container === document.body) {
                                let p = el.parentElement;
                                for (let i = 0; i < 8 && p; i++) { if (p !== document.body && p.parentElement !== document.body) p = p.parentElement; else break; }
                                container = p || el;
                            }
                            const text = container?.textContent || '';

                            // Thumbnail
                            let thumb = '';
                            const imgs = container?.querySelectorAll('img') || [];
                            for (const img of Array.from(imgs)) {
                                const src = (img as HTMLImageElement).src || '';
                                if (src && src.length > 20) { thumb = src; break; }
                            }

                            // Creative body - find meaningful text
                            let body = '';
                            const spans = container?.querySelectorAll('span') || [];
                            for (const span of Array.from(spans)) {
                                const t = span.textContent?.trim() || '';
                                if (t.length > 30 && t.length < 500 && !t.includes('facebook.com') && !t.includes('http')) {
                                    body = t; break;
                                }
                            }

                            ads.push({ id, ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`, thumbnail_url: thumb, creative_body: body, isActive: true });
                        }
                    }
                }

                return ads;
            });
        } catch {
            return [];
        }
    }

    /**
     * Extract ad IDs from full HTML via regex
     */
    private extractAdsFromHtml(html: string): ScrapedAd[] {
        const regex = /https?:\/\/(?:www\.)?facebook\.com\/ads\/library\/\?id=(\d{9,})/gi;
        const ids = new Set<string>();
        let m;
        while ((m = regex.exec(html)) !== null) ids.add(m[1]);
        return Array.from(ids).map(id => ({ id, ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`, isActive: true }));
    }

    /**
     * Extract ad data from script tag JSON content
     */
    private async extractAdsFromScripts(page: any): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate(() => {
                const ads: any[] = [];
                const seenIds = new Set<string>();
                const scripts = document.querySelectorAll('script:not([src])');

                for (const script of Array.from(scripts)) {
                    const text = (script as HTMLScriptElement).textContent || '';
                    // Look for JSON-like structures with ad IDs
                    const matches = text.match(/"id"\s*:\s*"(\d{9,})"/g);
                    if (!matches) continue;
                    for (const m of matches) {
                        const match = m.match(/"id"\s*:\s*"(\d{9,})"/);
                        if (match && !seenIds.has(match[1])) {
                            seenIds.add(match[1]);
                            ads.push({ id: match[1], ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${match[1]}`, isActive: true });
                        }
                    }
                }
                return ads;
            });
        } catch {
            return [];
        }
    }

    /**
     * Extract insights (top URLs, oldest dates)
     */
    private async extractInsights(page: any): Promise<{ topUrls: { url: string; count: number }[]; oldestDates: string[] }> {
        try {
            const data = await page.evaluate(() => {
                const dateEls = document.querySelectorAll('span');
                const dates: string[] = [];
                for (const el of Array.from(dateEls)) {
                    const t = el.innerText;
                    if (t.includes('Started running on') || t.includes('Veiculação iniciada') || t.includes('Active since') || t.includes('Ativo desde')) {
                        dates.push(t.trim());
                    }
                }
                const links = Array.from(document.querySelectorAll('a'))
                    .map(a => {
                        let h = a.href;
                        if (h && h.includes('l.facebook.com/l.php?u=')) {
                            try { h = decodeURIComponent(new URL(h).searchParams.get('u') || ''); } catch { }
                        }
                        return h;
                    })
                    .filter(h => h && h.startsWith('http') && !h.includes('facebook.com') && !h.includes('fb.com'));
                return { dates, links };
            });

            const oldestDates = [...new Set(data.dates as string[])].sort().slice(0, 10);
            const counts: Record<string, number> = {};
            for (const link of data.links) {
                try { const u = new URL(link); const b = u.origin + u.pathname; counts[b] = (counts[b] || 0) + 1; } catch { }
            }
            const topUrls = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([u, c]) => ({ url: u, count: c }));
            return { topUrls, oldestDates };
        } catch {
            return { topUrls: [], oldestDates: [] };
        }
    }
}

export const adLibraryScraper = new AdLibraryScraper();