import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/pages - List all pages
router.get('/', async (req: Request, res: Response) => {
    try {
        const { active, country, tags } = req.query;

        const where: any = {};
        if (active !== undefined) where.active = active === 'true';
        if (country) where.country = country;

        const pages = await prisma.page.findMany({
            where,
            include: {
                snapshots: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({
            success: true,
            data: pages,
            count: pages.length
        });
    } catch (error) {
        logger.error('Error fetching pages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pages' });
    }
});

// GET /api/pages/:id - Get single page with details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const page = await prisma.page.findUnique({
            where: { id },
            include: {
                snapshots: {
                    orderBy: { timestamp: 'desc' },
                    take: 30
                },
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 30
                }
            }
        });

        if (!page) {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }

        res.json({ success: true, data: page });
    } catch (error) {
        logger.error('Error fetching page:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch page' });
    }
});

// POST /api/pages - Create new page
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, url, offerUrl, checkoutUrl, description, country, language, category, tags } = req.body;

        // Extract Facebook Page ID from URL
        const urlMatch = url.match(/view_all_page_id=(\d+)/);
        const facebookPageId = urlMatch ? urlMatch[1] : url;

        const page = await prisma.page.create({
            data: {
                name,
                facebookPageId,
                url,
                offerUrl,
                checkoutUrl,
                description,
                country,
                language,
                category,
                tags: tags || []
            }
        });

        logger.info(`Created new page: ${name} (${facebookPageId})`);
        res.status(201).json({ success: true, data: page });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, error: 'Page already exists' });
        }

        logger.error('Error creating page:', error);

        res.status(500).json({ success: false, error: 'Failed to create page' });
    }
});

// PUT /api/pages/:id - Update page
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const page = await prisma.page.update({
            where: { id },
            data: updateData
        });

        logger.info(`Updated page: ${page.name}`);
        res.json({ success: true, data: page });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }
        logger.error('Error updating page:', error);
        res.status(500).json({ success: false, error: 'Failed to update page' });
    }
});

// DELETE /api/pages/:id - Delete page
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.page.delete({
            where: { id }
        });

        logger.info(`Deleted page: ${id}`);
        res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }
        logger.error('Error deleting page:', error);
        res.status(500).json({ success: false, error: 'Failed to delete page' });
    }
});

export default router;
