import 'dotenv/config';
import app from './app.js';
import logger from './utils/logger.js';
import prisma from './config/database.js';

const PORT = process.env.PORT || 5000;
console.log('DEBUG: CWD:', process.cwd());
console.log('DEBUG: DATABASE_URL raw:', JSON.stringify(process.env.DATABASE_URL));
console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV);

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Start server
        app.listen(Number(PORT), '0.0.0.0', () => {
            logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
            logger.info(`📊 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

main();
