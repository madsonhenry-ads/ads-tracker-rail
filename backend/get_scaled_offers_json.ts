import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const categories = await prisma.page.groupBy({
    by: ['category'],
    where: { category: { not: null }, active: true }
  });

  const finalResults: any[] = [];

  for (const cat of categories) {
    const categoryName = cat.category!;
    const topPage = await prisma.page.findFirst({
      where: { 
        category: categoryName,
        metrics: { some: { date: { gte: tenDaysAgo } } }
      },
      include: {
        metrics: {
          where: { date: { gte: tenDaysAgo } },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (topPage && topPage.metrics.length > 0) {
      const avgAds = topPage.metrics.reduce((sum, m) => sum + m.totalAds, 0) / topPage.metrics.length;
      finalResults.push({
        nicho: categoryName.toUpperCase(),
        oferta: topPage.name,
        media_anuncios: Math.round(avgAds),
        constancia: topPage.metrics.length >= 8 ? 'Alta' : 'Média',
        trend: topPage.metrics[0].trend || 'Estável',
        link: topPage.offerUrl || '---'
      });
    }
  }

  finalResults.sort((a, b) => b.media_anuncios - a.media_anuncios);
  console.log('---JSON_START---');
  console.log(JSON.stringify(finalResults, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
