import prisma from './src/config/database.js';

async function main() {
    const snapshots = await prisma.adSnapshot.findMany({
        take: 20,
        orderBy: { date: 'desc' }
    });
    console.log("Recent snapshots:");
    snapshots.forEach(s => console.log(`- Page: ${s.pageId}, Date: ${s.date.toISOString()}, Ads: ${s.totalAds}, Success: ${s.success}`));

    const pages = await prisma.page.findMany({
        take: 1
    });

    if (pages.length > 0) {
        const pageId = pages[0].id;
        console.log(`\nMetrics for page ${pageId}:`);
        const metrics = await prisma.metric.findMany({
            where: { pageId },
            take: 10,
            orderBy: { date: 'desc' }
        });
        metrics.forEach(m => console.log(`- Date: ${m.date.toISOString()}, Ads: ${m.totalAds}, WeeklyChange: ${m.weeklyChange}, MonthlyChange: ${m.monthlyChange}`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
