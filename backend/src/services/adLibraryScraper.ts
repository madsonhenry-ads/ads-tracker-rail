import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserDataDirPlugin from 'puppeteer-extra-plugin-user-data-dir';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { createCursor } from 'ghost-cursor';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// @ts-ignore
puppeteerExtra.use(StealthPlugin());
// @ts-ignore — persistent browser profile so Facebook sees a returning visitor
puppeteerExtra.use(UserDataDirPlugin({ folder: path.join(process.cwd(), '.browser-profile') }));
// @ts-ignore — set Chrome preferences to Brazilian Portuguese
puppeteerExtra.use(UserPreferencesPlugin({
    preferences: {
        intl: { accept_languages: 'pt-BR,pt,en-US,en' },
        profile: { content_settings: { exceptions: {} } },
    },
}));

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

interface ViewportConfig {
    width: number;
    height: number;
    isMobile: boolean;
    hasTouch: boolean;
    deviceScaleFactor: number;
    userAgent: string;
    label: string;
}

const MOBILE_VIEWPORT: ViewportConfig = {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    label: '📱 Mobile (iPhone)',
};

const DESKTOP_VIEWPORT: ViewportConfig = {
    width: 1920,
    height: 1080,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    label: '💻 Desktop (Chrome)',
};

export class AdLibraryScraper {

    private proxyHost = process.env.PRIVATEPROXY_HOST || '';
    private proxyPort = process.env.PRIVATEPROXY_PORT || '5432';
    private proxyUser = process.env.PRIVATEPROXY_USER || '';
    private proxyPass = process.env.PRIVATEPROXY_PASS || '';

    /**
     * Scrapes the Facebook Ad Library for a specific page using Puppeteer
     * with anti-detection, network interception, and ghost-cursor.
     */
    async scrapePageAds(pageId: string, options: ScrapeOptions = {}): Promise<AdLibraryScrapeResult> {
        const { country = 'ALL', activeStatus = 'active' } = options;

        logger.info(`🕵️‍♀️ [Deep Scrape] Iniciando para página: ${pageId} (country: ${country}, status: ${activeStatus})`);

        const activeParam = activeStatus === 'all' ? 'all' : activeStatus;
        const url = `https://www.facebook.com/ads/library/?active_status=${activeParam}&ad_type=all&country=${country}&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

        // --- Try multiple viewport strategies ---
        // Mobile first (less detection), then Desktop fallback
        const strategies: ViewportConfig[] = [MOBILE_VIEWPORT, DESKTOP_VIEWPORT];

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < strategies.length; attempt++) {
            const viewport = strategies[attempt];
            const useProxy = attempt >= 1 && !!this.proxyHost; // proxy only on retries

            logger.info(`🎯 [Deep Scrape] Tentativa ${attempt + 1}/${strategies.length}: ${viewport.label}${useProxy ? ' + proxy' : ''}`);

            try {
                const result = await this.scrapeWithViewport(
                    pageId, url, viewport, useProxy, country, activeStatus
                );

                if (result.totalAdsFound > 0) {
                    logger.info(`✅ [Deep Scrape] Sucesso na tentativa ${attempt + 1} com ${result.totalAdsFound} anúncios`);
                    return result;
                }

                logger.warn(`⚠️ [Deep Scrape] Tentativa ${attempt + 1} retornou 0 anúncios, tentando próxima estratégia...`);
            } catch (error: any) {
                lastError = error;
                logger.warn(`⚠️ [Deep Scrape] Tentativa ${attempt + 1} falhou: ${error.message}`);
            }
        }

        // If all strategies failed, throw the last error
        throw lastError || new Error('All scraping strategies returned 0 ads');
    }

    /**
     * Internal scrape with a specific viewport configuration
     */
    private async scrapeWithViewport(
        pageId: string,
        url: string,
        viewport: ViewportConfig,
        useProxy: boolean,
        country: string,
        activeStatus: string,
    ): Promise<AdLibraryScrapeResult> {
        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--single-process',
        ];

        let executablePath: string | undefined;

        // Auto-detect Chrome binary for Linux (Railway/Nixpacks)
        if (process.platform === 'linux') {
            const commonPaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
            ];
            for (const cp of commonPaths) {
                if (fs.existsSync(cp)) {
                    executablePath = cp;
                    logger.info(`🧭 [Deep Scrape] Navegador encontrado em: ${executablePath}`);
                    break;
                }
            }
        }

        if (useProxy && this.proxyHost) {
            const proxyUrl = `${this.proxyHost}:${this.proxyPort}`;
            launchArgs.push(`--proxy-server=http://${proxyUrl}`);
            logger.info(`🌐 [Deep Scrape] Usando proxy: ${this.proxyHost}`);
        }

        const launchOptions: any = {
            headless: true,
            args: launchArgs,
            defaultViewport: null, // Let the page define viewport — harder to fingerprint
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        logger.info(`🎬 [Deep Scrape] Lançando Puppeteer (${viewport.label})...`);
        const browser = await (puppeteerExtra as any).launch(launchOptions);

        try {
            const page = await browser.newPage();

            // Proxy authentication
            if (useProxy && this.proxyUser && this.proxyPass) {
                await page.authenticate({ username: this.proxyUser, password: this.proxyPass });
                logger.info(`🔐 [Deep Scrape] Autenticado no proxy`);
            }

            // --- Viewport + UA ---
            await page.setUserAgent(viewport.userAgent);
            await page.setViewport({
                width: viewport.width,
                height: viewport.height,
                isMobile: viewport.isMobile,
                hasTouch: viewport.hasTouch,
                deviceScaleFactor: viewport.deviceScaleFactor,
            });

            // --- Facebook Referrer Spoofing (borrowed from uncloakService) ---
            await page.setExtraHTTPHeaders({
                'Referer': 'https://l.facebook.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            });

            // --- Bypass webdriver detection ---
            await page.evaluateOnNewDocument(() => {
                // @ts-ignore
                delete Object.getPrototypeOf(navigator).webdriver;
                // @ts-ignore
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                // @ts-ignore
                Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
                // @ts-ignore
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            });

            // --- Network Interception: capture GraphQL responses from Facebook ---
            const graphqlResponses: any[] = [];
            const blockedRequests = new Set<string>();

            await page.setRequestInterception(true);

            page.on('request', (request) => {
                const resourceType = request.resourceType();
                // Block heavy/unecessary resources for speed
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    blockedRequests.add(request.url());
                    request.abort();
                } else {
                    request.continue();
                }
            });

            page.on('response', async (response) => {
                const respUrl = response.url();
                // Capture Facebook GraphQL API responses
                if (respUrl.includes('/api/graphql/') || respUrl.includes('/graphql')) {
                    try {
                        const json = await response.json();
                        if (json) {
                            graphqlResponses.push(json);
                        }
                    } catch {
                        // Not JSON or empty — skip
                    }
                }
            });

            // --- Navigate ---
            logger.info(`🚀 [Deep Scrape] Navegando para Ad Library (${viewport.label})...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

            // Wait for SPA content to render
            logger.info(`⏳ [Deep Scrape] Aguardando carregamento SPA (8s)...`);
            await new Promise(r => setTimeout(r, 8000));

            // Check for blockage / login wall
            const pageContent = await page.content();
            const lowerContent = pageContent.toLowerCase();
            if (lowerContent.includes('temporarily blocked') ||
                lowerContent.includes('log in') ||
                lowerContent.includes('entrar') ||
                lowerContent.includes('login')) {
                const blockScreen = await page.screenshot({ encoding: 'base64' });
                logger.warn(`⚠️ [Deep Scrape] Possível bloqueio detectado. Continuando...`);
                logger.info(`📸 Screenshot (base64 length): ${(blockScreen as string).length}`);
            }

            // --- Human-like scrolling with ghost-cursor ---
            logger.info(`🖱️ [Deep Scrape] Scroll human-like com ghost-cursor...`);
            try {
                const cursor = createCursor(page);
                // Initial mouse movement — human-like
                await cursor.moveTo({
                    x: Math.random() * (viewport.width * 0.6) + 50,
                    y: Math.random() * (viewport.height * 0.4) + 100,
                });
                await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
            } catch {
                // ghost-cursor may fail on some pages, fallback to JS scroll
                logger.info(`🖱️ [Deep Scrape] ghost-cursor indisponível, usando JS scroll`);
            }

            // Scroll the page with human-like behavior
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalScrolled = 0;
                    const maxScroll = Math.max(document.body.scrollHeight, 8000);
                    const stepSize = 80 + Math.random() * 40; // 80-120px per step
                    const interval = setInterval(() => {
                        window.scrollBy(0, stepSize);
                        totalScrolled += stepSize;
                        if (totalScrolled >= maxScroll * 0.7) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 150 + Math.random() * 100); // 150-250ms between steps
                });
            });

            // Extra wait for lazy-loaded content
            await new Promise(r => setTimeout(r, 3000));

            // --- EXTRACTION STRATEGY 1: Network GraphQL responses ---
            logger.info(`🔍 [Deep Scrape] Estratégia 1: Analisando ${graphqlResponses.length} respostas GraphQL...`);
            const adsFromGraphQL = this.extractAdsFromGraphQL(graphqlResponses);
            logger.info(`🔍 [Deep Scrape] GraphQL: ${adsFromGraphQL.length} anúncios extraídos`);

            if (adsFromGraphQL.length > 0) {
                // Try to get creative body / thumbnails from individual snapshot pages for richer data
                const enrichedAds = await this.enrichAdsFromDom(page, adsFromGraphQL);
                // Extract insights
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });

                return {
                    pageId,
                    totalAdsFound: enrichedAds.length,
                    ads: enrichedAds,
                    insights,
                    screenshot: screenshot as string,
                };
            }

            // --- EXTRACTION STRATEGY 2: DOM-based extraction (improved) ---
            logger.info(`🔍 [Deep Scrape] Estratégia 2: Extração DOM...`);
            const domAds = await this.extractAdsFromDom(page);

            if (domAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });

                return {
                    pageId,
                    totalAdsFound: domAds.length,
                    ads: domAds,
                    insights,
                    screenshot: screenshot as string,
                };
            }

            // --- EXTRACTION STRATEGY 3: Full HTML regex (fallback) ---
            logger.info(`🔍 [Deep Scrape] Estratégia 3: Varredura HTML completa...`);
            const htmlAds = this.extractAdsFromHtml(pageContent);

            if (htmlAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });

                return {
                    pageId,
                    totalAdsFound: htmlAds.length,
                    ads: htmlAds,
                    insights,
                    screenshot: screenshot as string,
                };
            }

            // --- EXTRACTION STRATEGY 4: window.__initialState / __NEXT_DATA__ ---
            logger.info(`🔍 [Deep Scrape] Estratégia 4: Buscando estado global JS...`);
            const jsStateAds = await this.extractAdsFromJsState(page);

            if (jsStateAds.length > 0) {
                const insights = await this.extractInsights(page);
                const screenshot = await page.screenshot({ encoding: 'base64' });

                return {
                    pageId,
                    totalAdsFound: jsStateAds.length,
                    ads: jsStateAds,
                    insights,
                    screenshot: screenshot as string,
                };
            }

            // No ads found with any strategy
            logger.warn(`⚠️ [Deep Scrape] Nenhum anúncio encontrado por qualquer estratégia.`);
            const screenshot = await page.screenshot({ encoding: 'base64' });

            return {
                pageId,
                totalAdsFound: 0,
                ads: [],
                screenshot: screenshot as string,
            };

        } catch (error: any) {
            logger.error(`❌ [Deep Scrape] Falha: ${error.message}`);
            console.error('SCRAPE_ERROR_STACK:', error);
            throw error;
        } finally {
            await browser.close().catch(() => { });
        }
    }

    /**
     * Parse GraphQL JSON responses to extract ad objects
     */
    private extractAdsFromGraphQL(responses: any[]): ScrapedAd[] {
        const adsMap = new Map<string, ScrapedAd>();
        const seenIds = new Set<string>();

        const traverse = (obj: any, depth: number = 0) => {
            if (!obj || depth > 20) return;
            if (typeof obj !== 'object') return;

            // Check if this node looks like an ad object
            if (obj.id && typeof obj.id === 'string' && obj.id.match(/^\d{9,}$/)) {
                // Check if it has ad-related fields
                const hasAdField = obj.ad_snapshot_url ||
                    obj.creative_body ||
                    obj.ad_creative_body ||
                    obj.creation_time ||
                    obj.ad_delivery_start_time ||
                    obj.thumbnail_url ||
                    obj.thumbnail;

                if (hasAdField && !seenIds.has(obj.id)) {
                    seenIds.add(obj.id);
                    const snapshotUrl = obj.ad_snapshot_url ||
                        obj.snapshot_url ||
                        `https://www.facebook.com/ads/library/?id=${obj.id}`;

                    adsMap.set(obj.id, {
                        id: obj.id,
                        ad_snapshot_url: snapshotUrl,
                        creative_body: obj.creative_body || obj.ad_creative_body || obj.body || '',
                        creative_title: obj.creative_title || obj.title || '',
                        creative_link: obj.creative_link || obj.link_url || '',
                        ad_delivery_start_time: obj.ad_delivery_start_time || obj.creation_time || '',
                        thumbnail_url: obj.thumbnail_url || obj.thumbnail || '',
                        isActive: true,
                    });
                }
            }

            // Recurse into arrays and objects
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    traverse(item, depth + 1);
                }
            } else {
                for (const key of Object.keys(obj)) {
                    try {
                        traverse(obj[key], depth + 1);
                    } catch { /* circular ref */ }
                }
            }
        };

        for (const resp of responses) {
            traverse(resp);
        }

        logger.info(`   📊 GraphQL parsing: ${adsMap.size} anúncios únicos encontrados`);
        return Array.from(adsMap.values());
    }

    /**
     * Try to enrich ads (get thumbnails, creative body) by reading the DOM
     */
    private async enrichAdsFromDom(page: any, ads: ScrapedAd[]): Promise<ScrapedAd[]> {
        try {
            const domData = await page.evaluate((adIds: string[]) => {
                const results: Record<string, any> = {};

                // Find all ad containers in the DOM
                const allLinks = Array.from(document.querySelectorAll('a'));
                for (const link of allLinks) {
                    const href = link.getAttribute('href') || (link as any).href || '';
                    const match = href.match(/[?&]id=(\d{9,})/);
                    if (!match) continue;

                    const id = match[1];
                    if (!adIds.includes(id)) continue;

                    // Find container
                    let container = link.closest('div[role="article"]') ||
                        link.closest('[data-pagelet]') ||
                        link.parentElement;

                    if (!container || container === document.body) {
                        container = link as HTMLElement;
                        for (let i = 0; i < 10; i++) {
                            if (container?.parentElement && container.parentElement !== document.body) {
                                container = container.parentElement;
                            } else break;
                        }
                    }

                    const cardText = container?.textContent || '';
                    const imgEls = container?.querySelectorAll('img') || [];

                    // Find best thumbnail
                    let thumbnailUrl = '';
                    let bestArea = 0;
                    for (const img of Array.from(imgEls)) {
                        const w = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width || 0;
                        const h = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height || 0;
                        const area = w * h;
                        if (area > 2500 && area > bestArea) {
                            bestArea = area;
                            thumbnailUrl = (img as HTMLImageElement).src;
                        }
                    }

                    // Try to find creative body text
                    const textEls = container?.querySelectorAll('span, div') || [];
                    let creativeBody = '';
                    for (const el of Array.from(textEls)) {
                        const text = (el as HTMLElement).textContent?.trim() || '';
                        if (text.length > 30 && text.length < 500 && !text.includes('facebook.com') && !text.includes('http')) {
                            creativeBody = text;
                            break;
                        }
                    }

                    if (!results[id]) {
                        results[id] = {};
                    }
                    if (thumbnailUrl) results[id].thumbnail_url = thumbnailUrl;
                    if (creativeBody) results[id].creative_body = creativeBody;
                }

                return results;
            }, ads.map(a => a.id));

            // Merge DOM data into ads
            for (const ad of ads) {
                const enrichment = domData[ad.id];
                if (enrichment) {
                    if (enrichment.thumbnail_url && !ad.thumbnail_url) {
                        ad.thumbnail_url = enrichment.thumbnail_url;
                    }
                    if (enrichment.creative_body && !ad.creative_body) {
                        ad.creative_body = enrichment.creative_body;
                    }
                }
            }

            return ads;
        } catch (error: any) {
            logger.warn(`   ⚠️ Enrichment failed: ${error.message}`);
            return ads;
        }
    }

    /**
     * Extract ads from DOM elements (improved version of original Strategy 3)
     */
    private async extractAdsFromDom(page: any): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate(() => {
                const ads: any[] = [];
                const seenIds = new Set<string>();

                // Multiple selector strategies for finding ad links
                const selectors = [
                    'a[href*="ads/library"]',
                    'a[href*="ad_library"]',
                    'a[href*="adlibrary"]',
                    'a[href*="/ads/about"]',
                    '[role="link"][href*="ads"]',
                ];

                for (const selector of selectors) {
                    const elements = Array.from(document.querySelectorAll(selector));
                    for (const el of elements) {
                        const href = el.getAttribute('href') || (el as any).href || '';
                        const match = href.match(/[?&]id=(\d{9,})/);
                        if (match && !seenIds.has(match[1])) {
                            seenIds.add(match[1]);
                            const id = match[1];

                            let container = el.closest('div[role="article"]') ||
                                el.closest('[data-pagelet]') ||
                                el.parentElement;
                            if (!container || container === document.body) {
                                container = el as HTMLElement;
                                for (let i = 0; i < 10; i++) {
                                    if (container?.parentElement && container.parentElement !== document.body) {
                                        container = container.parentElement;
                                    } else break;
                                }
                            }

                            const cardText = container?.textContent || '';

                            // Extract start date
                            let startDate = '';
                            const datePatterns = [
                                /(?:Started running on|Veiculação iniciada em|Veiculado a partir de|En circulación desde|Ativo desde|Active since|Começou a ser veiculado em)[:\s]+([^•\n]+)/i,
                                /(?:Data de início|Start date)[:\s]+([^•\n]+)/i,
                            ];

                            for (const pattern of datePatterns) {
                                const m = cardText.match(pattern);
                                if (m) {
                                    const rawDate = m[1].trim();
                                    try {
                                        const cleanParts = rawDate.replace(/,|de /g, ' ').split(/\s+/).filter((p: string) => p);
                                        if (cleanParts.length >= 3) {
                                            const day = parseInt(cleanParts[0]);
                                            const monthStr = cleanParts[1].toLowerCase().substring(0, 3);
                                            const year = parseInt(cleanParts[2]);
                                            const monthMap: { [key: string]: number } = {
                                                'jan': 0, 'fev': 1, 'feb': 1, 'mar': 2, 'abr': 3, 'apr': 3,
                                                'mai': 4, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'aug': 7,
                                                'set': 8, 'sep': 8, 'out': 9, 'oct': 9, 'nov': 10, 'dez': 11, 'dec': 11,
                                            };
                                            if (!isNaN(day) && !isNaN(year) && monthMap.hasOwnProperty(monthStr)) {
                                                const dateObj = new Date(year, monthMap[monthStr], day);
                                                const offset = dateObj.getTimezoneOffset() * 60000;
                                                startDate = new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
                                            } else {
                                                const directParse = new Date(rawDate);
                                                if (!isNaN(directParse.getTime())) startDate = directParse.toISOString();
                                            }
                                        }
                                    } catch (e) { /* ignore */ }
                                    break;
                                }
                            }

                            // Extract thumbnail
                            let thumbnailUrl = '';
                            if (container) {
                                const images = Array.from(container.querySelectorAll('img'));
                                let bestImg: any = null;
                                let maxArea = 0;
                                for (const img of images) {
                                    const w = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width || 0;
                                    const h = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height || 0;
                                    const area = w * h;
                                    if (area > 2500 && area > maxArea) { maxArea = area; bestImg = img; }
                                }
                                if (bestImg) {
                                    thumbnailUrl = (bestImg as HTMLImageElement).src;
                                } else {
                                    const video = container.querySelector('video');
                                    if (video?.poster) thumbnailUrl = video.poster;
                                }
                            }

                            // Extract creative body text
                            let creativeBody = '';
                            if (container) {
                                const spans = container.querySelectorAll('span');
                                for (const span of Array.from(spans)) {
                                    const text = span.textContent?.trim() || '';
                                    if (text.length > 20 && text.length < 500 &&
                                        !text.includes('facebook.com') && !text.includes('http') &&
                                        !text.includes('Started running') && !text.includes('Veiculação') &&
                                        !text.includes('Ativo') && !text.includes('Active')) {
                                        creativeBody = text;
                                        break;
                                    }
                                }
                            }

                            ads.push({
                                id,
                                ad_delivery_start_time: startDate,
                                ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`,
                                thumbnail_url: thumbnailUrl,
                                creative_body: creativeBody,
                                isActive: true,
                            });
                        }
                    }
                }

                return ads;
            });
        } catch (error: any) {
            logger.warn(`   ⚠️ DOM extraction failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Extract ad IDs from full HTML content via regex
     */
    private extractAdsFromHtml(htmlContent: string): ScrapedAd[] {
        const adUrlRegex = /https?:\/\/(?:www\.)?facebook\.com\/ads\/library\/\?id=(\d{9,})/gi;
        const foundIds = new Set<string>();
        let urlMatch;
        while ((urlMatch = adUrlRegex.exec(htmlContent)) !== null) {
            foundIds.add(urlMatch[1]);
        }
        logger.info(`   📄 HTML regex: ${foundIds.size} IDs encontrados`);

        return Array.from(foundIds).map(id => ({
            id,
            ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`,
            isActive: true,
        }));
    }

    /**
     * Try to extract ad data from JavaScript global state (__NEXT_DATA__, __initialState, etc.)
     */
    private async extractAdsFromJsState(page: any): Promise<ScrapedAd[]> {
        try {
            return await page.evaluate(() => {
                const ads: any[] = [];
                const seenIds = new Set<string>();

                // Try common global state variables
                const stateSources = [
                    (window as any).__NEXT_DATA__,
                    (window as any).__initialState,
                    (window as any).__INITIAL_STATE__,
                    (window as any).__reactPayload,
                    (window as any).data,
                ];

                const extractIds = (obj: any, depth = 0) => {
                    if (!obj || depth > 15) return;
                    if (typeof obj !== 'object') return;

                    if (obj.id && typeof obj.id === 'string' && obj.id.match(/^\d{9,}$/)) {
                        if (!seenIds.has(obj.id) && obj.ad_snapshot_url) {
                            seenIds.add(obj.id);
                            ads.push({
                                id: obj.id,
                                ad_snapshot_url: obj.ad_snapshot_url,
                                ad_delivery_start_time: obj.ad_delivery_start_time || obj.creation_time || '',
                                thumbnail_url: obj.thumbnail_url || obj.thumbnail || '',
                                creative_body: obj.creative_body || obj.ad_creative_body || '',
                                isActive: true,
                            });
                        }
                    }

                    if (Array.isArray(obj)) {
                        for (const item of obj) extractIds(item, depth + 1);
                    } else {
                        for (const key of Object.keys(obj)) {
                            try { extractIds(obj[key], depth + 1); } catch { }
                        }
                    }
                };

                for (const source of stateSources) {
                    if (source) extractIds(source);
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
                } catch (e) { /* ignore invalid URLs */ }
            }

            const topUrls = Object.entries(linkCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([url, count]) => ({ url, count }));

            return { topUrls, oldestDates };
        } catch (error: any) {
            logger.warn(`   ⚠️ Insights extraction failed: ${error.message}`);
            return { topUrls: [], oldestDates: [] };
        }
    }
}

export const adLibraryScraper = new AdLibraryScraper();