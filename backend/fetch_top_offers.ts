import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  console.log('📊 Buscando ofertas escaladas e constantes nos últimos 10 dias...');

  // 1. Pegar nichos únicos
  const pagesWithCategory = await prisma.page.findMany({
    where: { category: { not: null }, active: true },
    select: { category: true },
    distinct: ['category'],
  });

  const categories = pagesWithCategory.map(p => p.category as string);
  const results: any[] = [];

  for (const category of categories) {
    // 2. Para cada nicho, buscar a página com maior média móvel de anúncios (movingAvg7d) 
    // e que teve anúncios ativos nos últimos 10 dias.
    const topOffer = await prisma.page.findFirst({
      where: {
        category: category,
        metrics: {
          some: {
            date: { gte: tenDaysAgo },
            totalAds: { gt: 0 }
          }
        }
      },
      include: {
        metrics: {
          where: { date: { gte: tenDaysAgo } },
          orderBy: { date: 'desc' },
          take: 7
        }
      },
      orderBy: {
        metrics: {
          _count: 'desc' // Priorizar quem tem mais métricas registradas (constância)
        }
      }
    });

    if (topOffer) {
      const avgAds = topOffer.metrics.reduce((acc, m) => acc + m.totalAds, 0) / topOffer.metrics.length;
      results.push({
        nicho: category,
        nome: topOffer.name,
        media_anuncios: avgAds.toFixed(1),
        url_oferta: topOffer.offerUrl || 'Não identificada',
        constancia: topOffer.metrics.length >= 7 ? 'Alta' : 'Média'
      });
    }
  }

  // Ordenar por volume de anúncios (escala)
  results.sort((a, b) => parseFloat(b.media_anuncios) - parseFloat(a.media_anuncios));

  console.log('\n🏆 Melhores Ofertas por Nicho:');
  console.table(results);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
