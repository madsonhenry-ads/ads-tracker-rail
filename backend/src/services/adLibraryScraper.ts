import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import { logger } from '../utils/logger.js';
import fs from 'fs';

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

        logger.info(`🕵️‍♀️ [Deep Scrape] Iniciando página: ${pageId} (country: ${country}, status: ${activeStatus})`);

        const activeParam = activeStatus === 'all' ? 'all' : activeStatus;
        const url = `https://www.facebook.com/ads/library/?active_status=${activeParam}&ad_type=all&country=${country}&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

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
                // Filter out any ad whose ID equals the page ID
                const realAds = result.ads.filter(ad => ad.id !== pageId);
                result.ads = realAds;
                result.totalAdsFound = realAds.length;

                if (result.totalAdsFound > 0) {
                    logger.info(`✅ [Deep Scrape] Sucesso: ${result.totalAdsFound} anúncios (filtrados: ${result.ads.length - realAds.length})`);
                    return result;
                }
                logger.warn(`⚠️ Tentativa ${attempt + 1} retornou 0 anúncios reais`);
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
            '--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled',
            '--disable-gpu', '--disable-dev-shm-usage', '--single-process', '--lang=pt-BR',
        ];

        let executablePath: string | undefined;
        if (process.platform === 'linux') {
            for (const p of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
                if (fs.existsSync(p)) { executablePath = p; logger.info(`🧭 Chrome: ${p}`); break; }
            }
        }

        if (useProxy && this.proxyHost) {
            launchArgs.push(`--proxy-server=http://${this.proxyHost}:${this.proxyPort}`);
        }

        const browser = await (puppeteerExtra as any).launch({
            headless: true, args: launchArgs, executablePath, defaultViewport: null,
        });

        try {
            const page = await browser.newPage();

            if (useProxy && this.proxyUser && this.proxyPass) {
                await page.authenticate({ username: this.proxyUser, password: this.proxyPass });
            }

            await page.setUserAgent(s.ua);
            await page.setViewport({ width: s.width, height: s.height, isMobile: s.mobile, hasTouch: s.mobile, deviceScaleFactor: s.mobile ? 3 : 1 });

            await page.setExtraHTTPHeaders({
                'Referer': 'https://l.facebook.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            });

            await page.evaluateOnNewDocument(() => {
                // @ts-ignore
                delete Object.getPrototypeOf(navigator).webdriver;
                // @ts-ignore
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
                // @ts-ignore
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            });

            // --- Don't intercept requests — let everything load naturally ---
            // Just capture API responses
            const apiResponses: any[] = [];
            page.on('response', async (response) => {
                const ct = response.headers()['content-type'] || '';
                if (ct.includes('json') || response.url().includes('graphql')) {
                    try {
                        const j = await response.json();
                        if (j) apiResponses.push(j);
                    } catch { }
                }
            });

            logger.info(`🚀 [Deep Scrape] Navegando... (${s.label})`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

            const currentUrl = page.url();
            logger.info(`   📍 URL final: ${currentUrl}`);
            const title = await page.title();
            logger.info(`   📍 Título: "${title}"`);

            // Check if URL changed (redirected to login)
            if (!currentUrl.includes('ads/library') || currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
                logger.warn(`⚠️ Redirecionado! Página: ${currentUrl}`);
            }

            // Wait for page to settle — Facebook loads ads asynchronously
            logger.info(`⏳ [Deep Scrape] Aguardando carregamento (20s)...`);
            await new Promise(r => setTimeout(r, 20000));

            // Try to wait for any ad-related selector
            try {
                await page.waitForSelector('a[href*="/ads/library/"]', { timeout: 5000 });
                logger.info(`   ✅ Link de anúncio encontrado no DOM`);
            } catch {
                logger.info(`   ⏭️ Nenhum link de anúncio encontrado via selector`);
            }

            // Check page content for block
            const html = await page.content();
            const lower = html.toLowerCase();
            logger.info(`   📄 HTML length: ${html.length} chars`);

            if (lower.includes('temporarily blocked') || lower.includes('log in') || lower.includes('entrar') || lower.includes('crie uma conta') || lower.includes('create account')) {
                logger.warn(`⚠️⚠️⚠️ [Deep Scrape] BLOQUEIO DETECTADO!`);
            }

            // Log what the page body looks like (first 200 chars of body text)
            const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
            logger.info(`   📝 Body text (início): ${bodyText.replace(/\n/g, ' | ')}`);

            // --- Ghost cursor initial movement ---
            try {
                const cursor = createCursor(page);
                await cursor.moveTo({ x: 400 + Math.random() * 200, y: 500 + Math.random() * 200 });
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            } catch { }

            // --- Scroll in many small increments with generous delays ---
            logger.info(`📜 [Deep Scrape] Rolando (20 steps)...`);
            await page.evaluate(async () => {
                const maxH = Math.max(document.body.scrollHeight, 5000);
                const steps = 20;
                for (let i = 0; i < steps; i++) {
                    window.scrollTo(0, (maxH / steps) * (i + 1));
                    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
                }
                // Go back to top
                window.scrollTo(0, 0);
                await new Promise(r => setTimeout(r, 2000));
                // Second scroll pass
                for (let i = 0; i < steps; i++) {
                    window.scrollTo(0, (maxH / steps) * (i + 1));
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
                }
            });

            await new Promise(r => setTimeout(r, 5000));

            logger.info(`   📦 API responses capturadas: ${apiResponses.length}`);

            // --- STRATEGY 1: API responses (strict mode — only real ads) ---
            const adsFromApi = this.extractAdsFromJson(apiResponses, pageId);
            logger.info(`🔍 API: ${adsFromApi.length} anúncios`);

            if (adsFromApi.length > 0) {
                const insights = await this.extractInsights(page);
                const ss = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: adsFromApi.length, ads: adsFromApi, insights, screenshot: ss as string };
            }

            // --- STRATEGY 2: DOM extraction (improved) ---
            const domAds = await this.extractAdsFromDom(page, pageId);
            logger.info(`🔍 DOM: ${domAds.length} anúncios`);

            if (domAds.length > 0) {
                const insights = await this.extractInsights(page);
                const ss = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: domAds.length, ads: domAds, insights, screenshot: ss as string };
            }

            // --- STRATEGY 3: HTML regex (with page ID filter) ---
            const htmlAds = this.extractAdsFromHtml(html, pageId);
            logger.info(`🔍 HTML: ${htmlAds.length} anúncios`);

            if (htmlAds.length > 0) {
                const insights = await this.extractInsights(page);
                const ss = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: htmlAds.length, ads: htmlAds, insights, screenshot: ss as string };
            }

            // --- STRATEGY 4: script tags ---
            const scriptAds = await this.extractAdsFromScripts(page, pageId);
            logger.info(`🔍 Scripts: ${scriptAds.length} anúncios`);

            if (scriptAds.length > 0) {
                const insights = await this.extractInsights(page);
                const ss = await page.screenshot({ encoding: 'base64' });
                return { pageId, totalAdsFound: scriptAds.length, ads: scriptAds, insights, screenshot: ss as string };
            }

            const ss = await page.screenshot({ encoding: 'base64' });
            logger.warn(`⚠️ [Deep Scrape] Nenhum anúncio encontrado.`);
            return { pageId, totalAdsFound: 0, ads: [], screenshot: ss as string };

        } catch (error: any) {
            logger.error(`❌ [Deep Scrape] Falha: ${error.message}`);
            throw error;
        } finally {
            await browser.close().catch(() => { });
        }
    }

    /** Extract real ads from API/GraphQL responses — strict filtering */
    private extractAdsFromJson(responses: any[], pageId: string): ScrapedAd[] {
        const adsMap = new Map<string, ScrapedAd>();
        const seenIds = new Set<string>();

        const traverse = (obj: any, depth = 0) => {
            if (!obj || depth > 20 || typeof obj !== 'object') return;

            if (obj.id && typeof obj.id === 'string') {
                const id = obj.id;
                // Must be 9+ digits AND must not be the page ID
                if (id.match(/^\d{9,}$/) && id !== pageId && !seenIds.has(id)) {
                    // Require at least one ad-specific field
                    const hasAdField = obj.ad_snapshot_url?.includes('ads/library') ||
                        obj.creative_body ||
                        obj.ad_creative_body ||
                        obj.thumbnail_url?.includes('fbcdn') ||
                        obj.ad_delivery_start_time ||
                        (obj.creation_time && obj.creation_time.length > 5);

                    if (hasAdField || obj.ad_snapshot_url || (obj.thumbnail_url && obj.thumbnail_url.length > 30)) {
                        seenIds.add(id);
                        adsMap.set(id, {
                            id,
                            ad_snapshot_url: obj.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${id}`,
                            creative_body: obj.creative_body || obj.ad_creative_body || obj.body || '',
                            ad_delivery_start_time: obj.ad_delivery_start_time || obj.creation_time || '',
                            thumbnail_url: obj.thumbnail_url || obj.thumbnail || '',
                            isActive: true,
                        });
                    }
                }
            }

            if (Array.isArray(obj)) {
                for (const item of obj) traverse(item, depth + 1);
            } else if (typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                    try { traverse(obj[key], depth + 1); } catch { }
                }
            }
        };

        for (const resp of responses) traverse(resp);
        return Array.from(adsMap.values());
    }

    /** Extract ad links from rendered DOM */
    private async extractAdsFromDom(page: any, pageId: string): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate((pid: string) => {
                const ads: any[] = [];
                const seenIds = new Set<string>();

                const selectors = [
                    'a[href*="/ads/library/"]',
                    'a[href*="ad_library"]',
                    'a[href*="/ads/about"]',
                ];

                for (const sel of selectors) {
                    for (const el of Array.from(document.querySelectorAll(sel))) {
                        const href = el.getAttribute('href') || (el as any).href || '';
                        const m = href.match(/[?&]id=(\d{9,})/);
                        if (!m || !m[1] || m[1] === pid || seenIds.has(m[1])) continue;
                        seenIds.add(m[1]);
                        const id = m[1];

                        // Try to find closest container that might be an ad card
                        let container = el.closest('[role="article"]') || el.closest('[data-pagelet]');
                        if (!container) {
                            let p = el.parentElement;
                            for (let i = 0; i < 6 && p && p !== document.body; i++) { container = p; p = p.parentElement; }
                        }

                        // Thumbnail: find first meaningful image
                        let thumb = '';
                        if (container) {
                            const imgs = container.querySelectorAll('img');
                            for (const img of Array.from(imgs)) {
                                const src = (img as HTMLImageElement).src || '';
                                if (src && src.length > 30 && !src.includes('emoji') && !src.includes('blueprint')) {
                                    thumb = src; break;
                                }
                            }
                        }

                        ads.push({ id, ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`, thumbnail_url: thumb, isActive: true });
                    }
                }
                return ads;
            }, pageId);
        } catch { return []; }
    }

    /** Extract ad IDs from HTML content */
    private extractAdsFromHtml(html: string, pageId: string): ScrapedAd[] {
        const ids = new Set<string>();
        const regex = /https?:\/\/(?:www\.)?facebook\.com\/ads\/library\/\?id=(\d{9,})/gi;
        let m;
        while ((m = regex.exec(html)) !== null) {
            if (m[1] !== pageId) ids.add(m[1]);
        }
        return Array.from(ids).map(id => ({ id, ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`, isActive: true }));
    }

    /** Extract from inline scripts */
    private async extractAdsFromScripts(page: any, pageId: string): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate((pid: string) => {
                const ads: any[] = [];
                const seenIds = new Set<string>();
                for (const script of Array.from(document.querySelectorAll('script:not([src])'))) {
                    const text = (script as HTMLScriptElement).textContent || '';
                    const matches = text.match(/"id"\s*:\s*"(\d{9,})"/g);
                    if (!matches) continue;
                    for (const match of matches) {
                        const idMatch = match.match(/"id"\s*:\s*"(\d{9,})"/);
                        if (idMatch && idMatch[1] !== pid && !seenIds.has(idMatch[1])) {
                            seenIds.add(idMatch[1]);
                            ads.push({ id: idMatch[1], ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${idMatch[1]}`, isActive: true });
                        }
                    }
                }
                return ads;
            }, pageId);
        } catch { return []; }
    }

    private async extractInsights(page: any): Promise<{ topUrls: { url: string; count: number }[]; oldestDates: string[] }> {
        try {
            const data = await page.evaluate(() => {
                const dates: string[] = [];
                for (const el of Array.from(document.querySelectorAll('span'))) {
                    const t = el.innerText;
                    if (t.includes('Started running on') || t.includes('Veiculação iniciada') || t.includes('Active since') || t.includes('Ativo desde')) {
                        dates.push(t.trim());
                    }
                }
                const links = Array.from(document.querySelectorAll('a'))
                    .map(a => { let h = a.href; if (h?.includes('l.facebook.com/l.php?u=')) { try { h = decodeURIComponent(new URL(h).searchParams.get('u') || ''); } catch { } } return h; })
                    .filter(h => h && h.startsWith('http') && !h.includes('facebook.com') && !h.includes('fb.com'));
                return { dates, links };
            });

            const oldestDates = [...new Set(data.dates as string[])].sort().slice(0, 10);
            const counts: Record<string, number> = {};
            for (const link of (data.links as string[])) {
                try { const u = new URL(link); const b = u.origin + u.pathname; counts[b] = (counts[b] || 0) + 1; } catch { }
            }
            const topUrls = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([u, c]) => ({ url: u, count: c }));
            return { topUrls, oldestDates };
        } catch { return { topUrls: [], oldestDates: [] }; }
    }
}

export const adLibraryScraper = new AdLibraryScraper();