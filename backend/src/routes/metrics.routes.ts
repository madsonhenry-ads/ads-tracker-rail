import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/metrics - Dashboard overview metrics
router.get('/', async (req: Request, res: Response) => {
    try {
        // Get total pages
        const totalPages = await prisma.page.count({ where: { active: true } });

        // Get latest snapshots for all pages
        const pages = await prisma.page.findMany({
            where: { active: true },
            include: {
                snapshots: {
                    orderBy: { timestamp: 'desc' },
                    take: 2
                },
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        });

        // Calculate totals
        let totalActiveAds = 0;
        let previousTotalAds = 0;
        let pagesWithGrowth = 0;
        let pagesWithDecline = 0;

        pages.forEach(page => {
            if (page.snapshots[0]) {
                totalActiveAds += page.snapshots[0].totalAds;
            }
            if (page.snapshots[1]) {
                previousTotalAds += page.snapshots[1].totalAds;
            }
            if (page.metrics[0]) {
                if (page.metrics[0].trend === 'up') pagesWithGrowth++;
                if (page.metrics[0].trend === 'down') pagesWithDecline++;
            }
        });

        const totalChange = totalActiveAds - previousTotalAds;
        const totalChangePercent = previousTotalAds > 0
            ? ((totalChange / previousTotalAds) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                totalPages,
                totalActiveAds,
                totalChange,
                totalChangePercent: parseFloat(totalChangePercent as string),
                pagesWithGrowth,
                pagesWithDecline,
                pagesStable: totalPages - pagesWithGrowth - pagesWithDecline
            }
        });
    } catch (error) {
        logger.error('Error fetching overview metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
});

// GET /api/metrics/page/:pageId - Get metrics for specific page
router.get('/page/:pageId', async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;
        const { days = '30' } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const metrics = await prisma.metric.findMany({
            where: {
                pageId,
                date: { gte: startDate }
            },
            orderBy: { date: 'asc' }
        });

        res.json({
            success: true,
            data: metrics,
            count: metrics.length
        });
    } catch (error) {
        logger.error('Error fetching page metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
});

// GET /api/metrics/trends - Get trend data for charts
router.get('/trends', async (req: Request, res: Response) => {
    try {
        const { days = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        // Get all snapshots for the period, grouped by date
        const snapshots = await prisma.adSnapshot.findMany({
            where: {
                date: { gte: startDate },
                success: true
            },
            orderBy: { date: 'asc' }
        });

        // Aggregate by date
        const dailyTotals: Record<string, number> = {};
        snapshots.forEach(snapshot => {
            const dateStr = snapshot.date.toISOString().split('T')[0];
            if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
            dailyTotals[dateStr] += snapshot.totalAds;
        });

        const trendData = Object.entries(dailyTotals)
            .map(([date, totalAds]) => ({ date, totalAds }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data: trendData
        });
    } catch (error) {
        logger.error('Error fetching trends:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trends' });
    }
});

// GET /api/metrics/top-pages - Get pages with most ads
router.get('/top-pages', async (req: Request, res: Response) => {
    try {
        const { limit = '10' } = req.query;

        const pages = await prisma.page.findMany({
            where: { active: true },
            include: {
                snapshots: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        });

        const topPages = pages
            .filter(p => p.snapshots.length > 0)
            .map(p => ({
                id: p.id,
                name: p.name,
                totalAds: p.snapshots[0]?.totalAds || 0,
                trend: p.metrics[0]?.trend || 'stable',
                dailyChange: p.metrics[0]?.dailyChange || 0,
                dailyChangePercent: p.metrics[0]?.dailyChangePercent || 0,
                weeklyChange: p.metrics[0]?.weeklyChange || 0,
                weeklyChangePercent: p.metrics[0]?.weeklyChangePercent || 0,
                monthlyChange: p.metrics[0]?.monthlyChange || 0,
                monthlyChangePercent: p.metrics[0]?.monthlyChangePercent || 0
            }))
            .sort((a, b) => b.totalAds - a.totalAds)
            .slice(0, parseInt(limit as string));

        res.json({
            success: true,
            data: topPages
        });
    } catch (error) {
        logger.error('Error fetching top pages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top pages' });
    }
});

export default router;
