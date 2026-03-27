import prisma from './src/config/database.js';

async function clearStuckLogs() {
    console.log('Checking for stuck scraping logs...');
    
    const stuckLogs = await prisma.scrapingLog.updateMany({
        where: {
            status: 'running'
        },
        data: {
            status: 'failed',
            completedAt: new Date(),
            pagesFailed: -1 // Indique que foi interrompido
        }
    });

    console.log(`Cleared ${stuckLogs.count} stuck logs.`);
    process.exit(0);
}

clearStuckLogs().catch(err => {
    console.error(err);
    process.exit(1);
});
