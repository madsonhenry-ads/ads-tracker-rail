import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
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

    /**
     * Scrapes the Facebook Ad Library for a specific page using Puppeteer
     */
    async scrapePageAds(pageId: string, options: ScrapeOptions = {}): Promise<AdLibraryScrapeResult> {
        const {
            country = 'ALL',
            activeStatus = 'active',
        } = options;

        logger.info(`🕵️‍♀️ [Deep Scrape] Iniciando para página: ${pageId} (country: ${country}, status: ${activeStatus})`);

        // Map activeStatus to URL param value
        const activeParam = activeStatus === 'all' ? 'all' : activeStatus;

        const url = `https://www.facebook.com/ads/library/?active_status=${activeParam}&ad_type=all&country=${country}&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

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
            const commonPaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium'
            ];

            for (const path of commonPaths) {
                if (fs.existsSync(path)) {
                    executablePath = path;
                    logger.info(`🧭 [Deep Scrape] Navegador encontrado em: ${executablePath}`);
                    break;
                }
            }
        }

        if (this.proxyHost) {
            const proxyUrl = `${this.proxyHost}:${this.proxyPort}`;
            launchArgs.push(`--proxy-server=http://${proxyUrl}`);
            logger.info(`🌐 [Deep Scrape] Usando proxy configurado: ${this.proxyHost}`);
        }

        const launchOptions: any = {
            headless: true,
            args: launchArgs,
            defaultViewport: { width: 1280, height: 800 }
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        logger.info(`🎬 [Deep Scrape] Lançando Puppeteer...`);
        const browser = await (puppeteerExtra as any).launch(launchOptions);

        try {
            const page = await browser.newPage();

            if (this.proxyUser && this.proxyPass) {
                await page.authenticate({ username: this.proxyUser, password: this.proxyPass });
                logger.info(`🔐 [Deep Scrape] Autenticado no proxy`);
            }

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' });

            logger.info(`🚀 [Deep Scrape] Navegando para Ad Library...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

            // Initial wait for content to render
            logger.info(`⏳ [Deep Scrape] Aguardando carregamento inicial (5s)...`);
            await new Promise(r => setTimeout(r, 5000));

            // Check for blockage / login wall
            const pageContent = await page.content();
            const lowerContent = pageContent.toLowerCase();
            if (lowerContent.includes('temporarily blocked') || lowerContent.includes('log in') || lowerContent.includes('entrar')) {
                logger.warn('⚠️ [Deep Scrape] Facebook detectou acesso ou bloqueio. Continuando tentativa...');
                const blockScreen = await page.screenshot({ encoding: 'base64' });
                // Continue anyway — sometimes data is still rendered behind the overlay
            }

            // Scroll to load more ads — increase from 5 to 10 scrolls
            logger.info('📜 [Deep Scrape] Rolando página para carregar anúncios...');
            await page.evaluate(async () => {
                const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
                for (let i = 0; i < 10; i++) {
                    window.scrollBy(0, 1200);
                    await delay(1500);
                }
            });

            // --- Extract ads using link-based approach (more resilient) ---
            logger.info('🔍 [Deep Scrape] Extraindo IDs de anúncios da página...');

            const collectedAds = new Map<string, ScrapedAd>();

            // Extract ad data by looking for ad library links in the DOM
            const extractedAds = await page.evaluate(() => {
                const ads: ScrapedAd[] = [];

                // Find all links pointing to ads/library/?id=
                const allLinks = Array.from(document.querySelectorAll('a[href*="ads/library"]'));
                const seenIds = new Set<string>();
                const adLinks = allLinks.filter(link => {
                    const href = link.getAttribute('href') || '';
                    const match = href.match(/[?&]id=(\d{9,})/);
                    if (match && !seenIds.has(match[1])) {
                        seenIds.add(match[1]);
                        return true;
                    }
                    return false;
                });

                // For each unique ad link, walk up to find the card container and extract metadata
                for (const link of adLinks) {
                    const href = link.getAttribute('href') || '';
                    const idMatch = href.match(/[?&]id=(\d{9,})/);
                    if (!idMatch) continue;

                    const id = idMatch[1];
                    let container = link.closest('div[role="article"]') || link.closest('[data-pagelet]') || link.parentElement;

                    // If no article/parent container, walk up manually
                    if (!container || container === document.body) {
                        container = link;
                        for (let i = 0; i < 8; i++) {
                            if (container?.parentElement && container.parentElement !== document.body) {
                                container = container.parentElement;
                            } else {
                                break;
                            }
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
                        const match = cardText.match(pattern);
                        if (match) {
                            const rawDate = match[1].trim();
                            try {
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
                                        const offset = dateObj.getTimezoneOffset() * 60000;
                                        startDate = new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
                                    } else {
                                        const directParse = new Date(rawDate);
                                        if (!isNaN(directParse.getTime())) {
                                            startDate = directParse.toISOString();
                                        }
                                    }
                                }
                            } catch (e) {
                                // ignore parse errors
                            }
                            break;
                        }
                    }

                    // Extract thumbnail (largest image in card)
                    let thumbnailUrl = '';
                    if (container) {
                        const images = Array.from(container.querySelectorAll('img'));
                        let bestImg: HTMLImageElement | null = null;
                        let maxArea = 0;

                        for (const img of images) {
                            // Filter out tiny icons / profile pics
                            const w = img.naturalWidth || (img as any).width || 0;
                            const h = img.naturalHeight || (img as any).height || 0;
                            const area = w * h;
                            if (area > 2500 && area > maxArea) {
                                maxArea = area;
                                bestImg = img;
                            }
                        }

                        // Fallback: check for video poster
                        if (bestImg) {
                            thumbnailUrl = bestImg.src;
                        } else {
                            const video = container.querySelector('video');
                            if (video && video.poster) {
                                thumbnailUrl = video.poster;
                            }
                        }
                    }

                    // Extract creative body text (look for paragraphs with substantial text)
                    let creativeBody = '';
                    if (container) {
                        const textElements = Array.from(container.querySelectorAll('p, span, div'));
                        for (const el of textElements) {
                            const text = (el as HTMLElement).innerText?.trim();
                            if (text && text.length > 20 && text.length < 500) {
                                // Skip known non-creative text patterns
                                if (!text.startsWith('http') && !text.includes('ID:') && !text.match(/^\d+$/) && !text.includes('Started running') && !text.includes('Veiculação')) {
                                    creativeBody = text;
                                    break;
                                }
                            }
                        }
                    }

                    ads.push({
                        id,
                        ad_delivery_start_time: startDate,
                        ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`,
                        thumbnail_url: thumbnailUrl,
                        isActive: true,
                        creative_body: creativeBody,
                    });
                }

                return ads;
            });

            // Deduplicate by ID
            for (const ad of extractedAds) {
                if (!collectedAds.has(ad.id)) {
                    collectedAds.set(ad.id, ad);
                }
            }

            logger.info(`📄 [Deep Scrape] Encontrados ${collectedAds.size} anúncios via links.`);

            // If link extraction found nothing, try fallback raw text scanning
            if (collectedAds.size === 0) {
                logger.info('⚠️ [Deep Scrape] Nenhum anúncio encontrado via links. Tentando fallback de texto...');
                const textAds = await page.evaluate(() => {
                    const found: ScrapedAd[] = [];
                    const bodyText = document.body.innerText || '';
                    // Look for ID patterns in plain text
                    const idRegex = /(?:ID|Identificação)[:\s]+(\d{9,})/gi;
                    let match;
                    const seen = new Set<string>();
                    while ((match = idRegex.exec(bodyText)) !== null) {
                        const id = match[1];
                        if (!seen.has(id)) {
                            seen.add(id);
                            found.push({
                                id,
                                ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${id}`,
                                isActive: true,
                            });
                        }
                    }
                    return found;
                });

                for (const ad of textAds) {
                    if (!collectedAds.has(ad.id)) {
                        collectedAds.set(ad.id, ad);
                    }
                }
                logger.info(`📄 [Deep Scrape] Fallback encontrou mais ${textAds.length} anúncios. Total: ${collectedAds.size}`);
            }

            // --- Extract Insights (Top URLs and Oldest Dates) ---
            logger.info('📊 [Deep Scrape] Extraindo insights...');
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
                    // ignore invalid URLs
                }
            }
            const topUrls = Object.entries(linkCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([url, count]) => ({ url, count }));

            // Take screenshot for debug
            const screenshot = await page.screenshot({ encoding: 'base64' });

            const resultArray: ScrapedAd[] = Array.from(collectedAds.values());

            logger.info(`✅ [Deep Scrape] Finalizado. Total: ${resultArray.length} anúncios, ${topUrls.length} URLs de destino.`);

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
            logger.error(`❌ [Deep Scrape] Falha: ${error.message}`);
            console.error('SCRAPE_ERROR_STACK:', error);
            try {
                const debugPath = require('path').join(process.cwd(), 'scrape_debug_absolute.txt');
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