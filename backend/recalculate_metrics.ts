import prisma from './src/config/database.js';
import { scraperService } from './src/services/scraperService.js';

async function recalculate() {
    const pages = await prisma.page.findMany();
    console.log(`Recalculating metrics for ${pages.length} pages...`);
    for (const page of pages) {
        // use any type to bypass private method constraint
        await (scraperService as any).calculateMetrics(page.id);
        console.log(`- Recalculated for page: ${page.name}`);
    }
}

recalculate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
