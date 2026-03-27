import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/snapshots - List snapshots with optional filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const { pageId, startDate, endDate, limit = '100' } = req.query;

        const where: any = {};
        if (pageId) where.pageId = pageId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const snapshots = await prisma.adSnapshot.findMany({
            where,
            include: {
                page: {
                    select: { name: true, facebookPageId: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string)
        });

        res.json({
            success: true,
            data: snapshots,
            count: snapshots.length
        });
    } catch (error) {
        logger.error('Error fetching snapshots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch snapshots' });
    }
});

// GET /api/snapshots/page/:pageId - Get snapshots for specific page
router.get('/page/:pageId', async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;
        const { days = '30' } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const snapshots = await prisma.adSnapshot.findMany({
            where: {
                pageId,
                date: { gte: startDate }
            },
            orderBy: { date: 'asc' }
        });

        res.json({
            success: true,
            data: snapshots,
            count: snapshots.length
        });
    } catch (error) {
        logger.error('Error fetching page snapshots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch snapshots' });
    }
});

// GET /api/snapshots/latest - Get latest snapshot for each page
router.get('/latest', async (req: Request, res: Response) => {
    try {
        const pages = await prisma.page.findMany({
            where: { active: true },
            include: {
                snapshots: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });

        const latestSnapshots = pages
            .filter(p => p.snapshots.length > 0)
            .map(p => ({
                pageId: p.id,
                pageName: p.name,
                ...p.snapshots[0]
            }));

        res.json({
            success: true,
            data: latestSnapshots,
            count: latestSnapshots.length
        });
    } catch (error) {
        logger.error('Error fetching latest snapshots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch latest snapshots' });
    }
});

export default router;
