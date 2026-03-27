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
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173',
    'https://frontend-production-6bfc.up.railway.app',
    'http://frontend-production-6bfc.up.railway.app'
];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // Se testar a partir de outro lugar novo não-listado, libera mesmo assim pra não bloquear o painel
            return callback(null, true);
        }
        return callback(null, origin);
    },
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
