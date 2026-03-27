import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import pagesRoutes from './routes/pages.routes.js';
import snapshotsRoutes from './routes/snapshots.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import scraperRoutes from './routes/scraper.routes.js';
import funnelRoutes from './routes/funnel.routes.js';

dotenv.config();
// Trigger restart for env update

const app: Express = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/pages', pagesRoutes);
app.use('/api/snapshots', snapshotsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/tools', funnelRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack || err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

export default app;
