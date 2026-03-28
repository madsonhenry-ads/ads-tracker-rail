import { Request, Response } from 'express';
import { funnelService } from '../services/funnelService.js';
import { uncloakService } from '../services/uncloakService.js';
import { adLibraryService } from '../services/adLibraryService.js';
import { adLibraryScraper } from '../services/adLibraryScraper.js';
import { transcriptionService } from '../services/transcriptionService.js';
import { logger } from '../utils/logger.js';

// ... other exports ...

export const transcribeAdVideo = async (req: Request, res: Response) => {
    try {
        const { videoUrl } = req.body;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'videoUrl is required' });
        }

        const transcript = await transcriptionService.transcribeAudio(videoUrl);
        res.json({ success: true, text: transcript });
    } catch (error: any) {
        logger.error('Error in transcribeAdVideo controller', error);
        res.status(500).json({ error: error.message });
    }
};

export const enumerateSubdomains = async (req: Request, res: Response) => {
    try {
        const { domain } = req.body;
        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        const subdomains = await funnelService.enumerateSubdomains(domain);
        res.json({ domain, subdomains });
    } catch (error: any) {
        logger.error('Error in enumerateSubdomains controller', error);
        res.status(500).json({ error: error.message });
    }
};

export const mapFunnel = async (req: Request, res: Response) => {
    try {
        const { url, headful } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const funnel = await funnelService.mapFunnel(url as string, 2, !!headful);
        res.json({ funnel });
    } catch (error: any) {
        logger.error('Error in mapFunnel controller', error);
        res.status(500).json({ error: error.message });
    }
};

export const uncloakUrl = async (req: Request, res: Response) => {
    try {
        const { url, useProxy, headful, mobile } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const result = await uncloakService.uncloak(url, { useProxy, headful, mobile });
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Error in uncloakUrl controller', error);
        res.status(500).json({ error: error.message });
    }
};

export const swapProxyIp = async (req: Request, res: Response) => {
    try {
        const success = await uncloakService.swapProxyIp();
        res.json({ success });
    } catch (error: any) {
        logger.error('Error swapping proxy IP', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPageAds = async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;
        const { country, status, cursor, limit } = req.query;

        if (!pageId) {
            return res.status(400).json({ error: 'pageId is required' });
        }

        const result = await adLibraryService.getPageAds(pageId, {
            country: String(country || 'ALL'),
            adActiveStatus: String(status || 'active'),
            cursor: cursor as string,
            limit: limit ? parseInt(limit as string) : 50,
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Error fetching page ads', error);
        res.status(500).json({ error: error.message });
    }
};

export const getAllPageAds = async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;
        const { country, status } = req.query;

        if (!pageId) {
            return res.status(400).json({ error: 'pageId is required' });
        }

        const result = await adLibraryService.getAllPageAds(pageId, {
            country: String(country || 'ALL'),
            adActiveStatus: String(status || 'active'),
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Error fetching all page ads', error);
        res.status(500).json({ error: error.message });
    }
};

export const scrapePageAds = async (req: Request, res: Response) => {
    try {
        const { pageId } = req.body;
        if (!pageId) {
            return res.status(400).json({ error: 'pageId is required' });
        }

        const result = await adLibraryScraper.scrapePageAds(pageId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Error scraping page ads', error);
        res.status(500).json({ error: error.message });
    }
};
