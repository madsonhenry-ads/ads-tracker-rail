import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  // 1. Pegar nichos únicos que tenham anúncios nos últimos 10 dias
  const categories = await prisma.page.groupBy({
    by: ['category'],
    where: { category: { not: null }, active: true }
  });

  const finalResults: any[] = [];

  for (const cat of categories) {
    const categoryName = cat.category!;
    
    // Pesquisar a melhor página deste nicho
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
        Nicho: categoryName.toUpperCase(),
        Oferta: topPage.name,
        'Média Anúncios (10d)': avgAds.toFixed(0),
        'Constância': topPage.metrics.length >= 8 ? 'Excelente' : 'Boa',
        'Status Trend': topPage.metrics[0].trend || 'Estável',
        'Link': topPage.offerUrl || '---'
      });
    }
  }

  // Ordenar por volume de anúncios
  finalResults.sort((a, b) => parseInt(b['Média Anúncios (10d)']) - parseInt(a['Média Anúncios (10d)']));

  console.log('\n🔥 OFERTAS MAIS ESCALADAS E CONSTANTES (ÚLTIMOS 10 DIAS) 🔥');
  console.table(finalResults);
}

main().finally(() => prisma.$disconnect());
