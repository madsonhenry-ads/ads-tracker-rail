import puppeteer, { Browser, Page } from 'puppeteer';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

interface ScrapingResult {
    success: boolean;
    totalAds: number;
    error?: string;
    duration: number;
}

class ScraperService {
    private browser: Browser | null = null;
    private readonly maxRetries = parseInt(process.env.SCRAPER_MAX_RETRIES || '3');
    private readonly retryDelay = parseInt(process.env.SCRAPER_RETRY_DELAY || '5000');
    private readonly timeout = parseInt(process.env.SCRAPER_TIMEOUT || '30000');

    async initialize(): Promise<void> {
        if (!this.browser) {
            logger.info('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: process.env.SCRAPER_HEADLESS !== 'false',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            logger.info('Browser launched successfully');
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            logger.info('Browser closed');
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrapePage(pageUrl: string): Promise<ScrapingResult> {
        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.info(`Scraping attempt ${attempt}/${this.maxRetries}: ${pageUrl}`);

                await this.initialize();
                const page = await this.browser!.newPage();

                // Set viewport and user agent
                await page.setViewport({ width: 1920, height: 1080 });
                await page.setUserAgent(
                    process.env.SCRAPER_USER_AGENT ||
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                );

                // Navigate to page
                await page.goto(pageUrl, {
                    waitUntil: 'networkidle2',
                    timeout: this.timeout
                });

                // Wait for content to load
                await this.delay(3000);

                // Try to find the ad count element
                // Facebook Ads Library shows "X ads use this creative and targeting"
                // or displays the number of active ads
                const totalAds = await this.extractAdCount(page);

                await page.close();

                const duration = Date.now() - startTime;
                logger.info(`Successfully scraped ${totalAds} ads in ${duration}ms`);

                return {
                    success: true,
                    totalAds,
                    duration
                };
            } catch (error: any) {
                logger.warn(`Attempt ${attempt} failed: ${error.message}`);

                if (attempt < this.maxRetries) {
                    const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
                    logger.info(`Retrying in ${backoffDelay}ms...`);
                    await this.delay(backoffDelay);
                } else {
                    return {
                        success: false,
                        totalAds: 0,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
        }

        return {
            success: false,
            totalAds: 0,
            error: 'Max retries exceeded',
            duration: Date.now() - startTime
        };
    }

    private async extractAdCount(page: Page): Promise<number> {
        // Try multiple selectors as Facebook's structure may vary
        const selectors = [
            // Common patterns for Facebook Ads Library
            '[data-testid="active_ads_count"]',
            '.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6',
            'span:contains("ads")',
            '[aria-label*="ads"]'
        ];

        // Try to find text containing ad count
        const pageContent = await page.content();

        // Pattern: Look for "X ads" or "X active ads" or similar
        const patterns = [
            /(\d+(?:,\d+)*)\s*ads?\s+(?:use|uses)/i,
            /(\d+(?:,\d+)*)\s*active\s*ads?/i,
            /showing\s+(\d+(?:,\d+)*)\s*ads?/i,
            /(\d+(?:,\d+)*)\s*results?/i
        ];

        for (const pattern of patterns) {
            const match = pageContent.match(pattern);
            if (match) {
                const count = parseInt(match[1].replace(/,/g, ''));
                if (!isNaN(count)) {
                    return count;
                }
            }
        }

        // Try evaluating DOM directly
        const count = await page.evaluate(() => {
            // Look for elements that might contain ad count
            const elements = Array.from(document.querySelectorAll('span, div'));
            for (const el of elements) {
                const text = el.textContent || '';
                const match = text.match(/(\d+(?:,\d+)*)\s*ads?/i);
                if (match) {
                    return parseInt(match[1].replace(/,/g, ''));
                }
            }
            return 0;
        });

        return count;
    }

    async scrapeAllPages(): Promise<{
        total: number;
        success: number;
        failed: number;
        results: Array<{ pageId: string; pageName: string; result: ScrapingResult }>;
    }> {
        const pages = await prisma.page.findMany({
            where: {
                active: true,
                scrapingEnabled: true
            }
        });

        logger.info(`Starting bulk scrape of ${pages.length} pages`);

        const results: Array<{ pageId: string; pageName: string; result: ScrapingResult }> = [];
        let successCount = 0;
        let failedCount = 0;

        // Create scraping log
        const scrapingLog = await prisma.scrapingLog.create({
            data: {
                status: 'running',
                triggeredBy: 'api',
                pagesScraped: pages.length
            }
        });

        try {
            await this.initialize();

            for (const page of pages) {
                const result = await this.scrapePage(page.url);
                results.push({ pageId: page.id, pageName: page.name, result });

                if (result.success) {
                    successCount++;

                    // Save snapshot
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    await prisma.adSnapshot.upsert({
                        where: {
                            pageId_date: {
                                pageId: page.id,
                                date: today
                            }
                        },
                        update: {
                            totalAds: result.totalAds,
                            timestamp: new Date(),
                            scrapeDuration: result.duration,
                            success: true
                        },
                        create: {
                            pageId: page.id,
                            totalAds: result.totalAds,
                            date: today,
                            scrapeDuration: result.duration,
                            success: true
                        }
                    });

                    // Update page lastScrapedAt
                    await prisma.page.update({
                        where: { id: page.id },
                        data: { lastScrapedAt: new Date() }
                    });

                    // Calculate metrics
                    await this.calculateMetrics(page.id);
                } else {
                    failedCount++;

                    // Log failed attempt
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    await prisma.adSnapshot.upsert({
                        where: {
                            pageId_date: {
                                pageId: page.id,
                                date: today
                            }
                        },
                        update: {
                            success: false,
                            errorMessage: result.error,
                            scrapeDuration: result.duration
                        },
                        create: {
                            pageId: page.id,
                            totalAds: 0,
                            date: today,
                            success: false,
                            errorMessage: result.error,
                            scrapeDuration: result.duration
                        }
                    });
                }

                // Small delay between pages to avoid rate limiting
                await this.delay(2000);
            }

            // Update scraping log
            await prisma.scrapingLog.update({
                where: { id: scrapingLog.id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    duration: Date.now() - scrapingLog.startedAt.getTime(),
                    pagesSuccess: successCount,
                    pagesFailed: failedCount
                }
            });

        } finally {
            await this.close();
        }

        logger.info(`Bulk scrape completed: ${successCount} success, ${failedCount} failed`);

        return {
            total: pages.length,
            success: successCount,
            failed: failedCount,
            results
        };
    }

    private async calculateMetrics(pageId: string): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get snapshots for calculations
        const snapshots = await prisma.adSnapshot.findMany({
            where: {
                pageId,
                success: true,
                date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            },
            orderBy: { date: 'desc' }
        });

        if (snapshots.length === 0) return;

        const todaySnapshot = snapshots[0];

        // Find yesterday's snapshot (closest one before today)
        const yesterdaySnapshot = snapshots.find(s => s.date.getTime() < todaySnapshot.date.getTime());

        // Find the oldest snapshot within the last 7 days
        const weekAgoTime = today.getTime() - 7 * 24 * 60 * 60 * 1000;
        const snapshotsLast7Days = snapshots.filter(s => s.date.getTime() >= weekAgoTime);
        const weekAgoSnapshot = snapshotsLast7Days.length > 0 ? snapshotsLast7Days[snapshotsLast7Days.length - 1] : null;

        // Find the oldest snapshot within the last 30 days
        const monthAgoTime = today.getTime() - 30 * 24 * 60 * 60 * 1000;
        const snapshotsLast30Days = snapshots.filter(s => s.date.getTime() >= monthAgoTime);
        const monthAgoSnapshot = snapshotsLast30Days.length > 0 ? snapshotsLast30Days[snapshotsLast30Days.length - 1] : null;

        // Calculate changes
        const dailyChange = yesterdaySnapshot
            ? todaySnapshot.totalAds - yesterdaySnapshot.totalAds
            : null;
        const weeklyChange = weekAgoSnapshot
            ? todaySnapshot.totalAds - weekAgoSnapshot.totalAds
            : null;
        const monthlyChange = monthAgoSnapshot
            ? todaySnapshot.totalAds - monthAgoSnapshot.totalAds
            : null;

        // Calculate percentages
        const dailyChangePercent = yesterdaySnapshot && yesterdaySnapshot.totalAds > 0
            ? (dailyChange! / yesterdaySnapshot.totalAds) * 100
            : null;
        const weeklyChangePercent = weekAgoSnapshot && weekAgoSnapshot.totalAds > 0
            ? (weeklyChange! / weekAgoSnapshot.totalAds) * 100
            : null;
        const monthlyChangePercent = monthAgoSnapshot && monthAgoSnapshot.totalAds > 0
            ? (monthlyChange! / monthAgoSnapshot.totalAds) * 100
            : null;

        // Calculate moving averages
        const last7 = snapshots.slice(0, 7);
        const last30 = snapshots.slice(0, 30);

        const movingAvg7d = last7.length > 0
            ? last7.reduce((sum, s) => sum + s.totalAds, 0) / last7.length
            : null;
        const movingAvg30d = last30.length > 0
            ? last30.reduce((sum, s) => sum + s.totalAds, 0) / last30.length
            : null;

        // Determine trend
        let trend = 'stable';
        if (dailyChange && Math.abs(dailyChange) > 0) {
            trend = dailyChange > 0 ? 'up' : 'down';
        }

        // Calculate 7-day stats
        const adsValues = last7.map(s => s.totalAds);
        const maxAdsLast7d = adsValues.length > 0 ? Math.max(...adsValues) : null;
        const minAdsLast7d = adsValues.length > 0 ? Math.min(...adsValues) : null;
        const avgAdsLast7d = movingAvg7d;

        await prisma.metric.upsert({
            where: {
                pageId_date: {
                    pageId,
                    date: today
                }
            },
            update: {
                totalAds: todaySnapshot.totalAds,
                dailyChange,
                weeklyChange,
                monthlyChange,
                dailyChangePercent,
                weeklyChangePercent,
                monthlyChangePercent,
                movingAvg7d,
                movingAvg30d,
                maxAdsLast7d,
                minAdsLast7d,
                avgAdsLast7d,
                trend,
                updatedAt: new Date()
            },
            create: {
                pageId,
                date: today,
                totalAds: todaySnapshot.totalAds,
                dailyChange,
                weeklyChange,
                monthlyChange,
                dailyChangePercent,
                weeklyChangePercent,
                monthlyChangePercent,
                movingAvg7d,
                movingAvg30d,
                maxAdsLast7d,
                minAdsLast7d,
                avgAdsLast7d,
                trend
            }
        });

        logger.info(`Metrics calculated for page ${pageId}`);
    }
}

export const scraperService = new ScraperService();
export default scraperService;
