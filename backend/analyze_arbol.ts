import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const page = await prisma.page.findFirst({
    where: { name: { contains: 'Árbol De La Vida', mode: 'insensitive' } },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30
      },
      adSnapshots: {
        orderBy: { timestamp: 'desc' },
        take: 10
      }
    }
  });

  if (!page) {
    console.log('Page not found');
    return;
  }

  console.log('---JSON_START---');
  console.log(JSON.stringify({
    name: page.name,
    totalMetrics: page.metrics.length,
    recentMetrics: page.metrics.map(m => ({ date: m.date, ads: m.totalAds, trend: m.trend })),
    recentSnapshots: page.adSnapshots.map(s => ({ id: s.id, timestamp: s.timestamp }))
  }, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
