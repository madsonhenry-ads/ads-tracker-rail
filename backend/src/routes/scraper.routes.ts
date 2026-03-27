import { Router, Request, Response } from 'express';
import scraperService from '../services/scraperService.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const router = Router();

// POST /api/scraper/run - Run scraper for all pages
router.post('/run', async (req: Request, res: Response) => {
    try {
        logger.info('Starting manual scrape for all pages...');

        // Run scraper in background
        const resultPromise = scraperService.scrapeAllPages();

        res.json({
            success: true,
            message: 'Scraping started. This may take several minutes.',
            status: 'running'
        });

        // Log result when complete
        resultPromise.then(result => {
            logger.info(`Scraping completed: ${result.success}/${result.total} pages successful`);
        }).catch(err => {
            logger.error('Scraping failed:', err);
        });
    } catch (error: any) {
        logger.error('Error starting scraper:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/scraper/run/:pageId - Run scraper for single page
router.post('/run/:pageId', async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;

        const page = await prisma.page.findUnique({
            where: { id: pageId }
        });

        if (!page) {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }

        logger.info(`Starting manual scrape for page: ${page.name}`);

        const result = await scraperService.scrapePage(page.url);

        if (result.success) {
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

            // Update page
            await prisma.page.update({
                where: { id: page.id },
                data: { lastScrapedAt: new Date() }
            });

            res.json({
                success: true,
                data: {
                    pageId: page.id,
                    pageName: page.name,
                    totalAds: result.totalAds,
                    duration: result.duration
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                duration: result.duration
            });
        }
    } catch (error: any) {
        logger.error('Error running scraper:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/scraper/status - Get scraper status
router.get('/status', async (req: Request, res: Response) => {
    try {
        const latestLog = await prisma.scrapingLog.findFirst({
            orderBy: { startedAt: 'desc' }
        });

        const runningLogs = await prisma.scrapingLog.count({
            where: { status: 'running' }
        });

        res.json({
            success: true,
            data: {
                isRunning: runningLogs > 0,
                latestRun: latestLog
            }
        });
    } catch (error: any) {
        logger.error('Error getting scraper status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/scraper/logs - Get scraping logs
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const { limit = '20' } = req.query;

        const logs = await prisma.scrapingLog.findMany({
            orderBy: { startedAt: 'desc' },
            take: parseInt(limit as string)
        });

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error: any) {
        logger.error('Error fetching scraper logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
