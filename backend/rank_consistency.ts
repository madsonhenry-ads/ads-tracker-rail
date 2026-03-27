import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const pages = await prisma.page.findMany({
    where: { 
      active: true,
      metrics: { some: { date: { gte: tenDaysAgo }, totalAds: { gt: 0 } } }
    },
    include: {
      metrics: {
        where: { date: { gte: tenDaysAgo } },
        orderBy: { date: 'desc' }
      }
    }
  });

  const processedOffers = pages.map(page => {
    const activeDays = page.metrics.filter(m => m.totalAds > 0).length;
    const avgAds = page.metrics.reduce((sum, m) => sum + m.totalAds, 0) / (page.metrics.length || 1);
    const currentAds = page.metrics[0]?.totalAds || 0;

    return {
      nicho: (page.category || 'OUTROS').toUpperCase(),
      oferta: page.name,
      dias_ativos: activeDays,
      media_anuncios: Math.round(avgAds),
      ads_hoje: currentAds,
      link: page.offerUrl || '---'
    };
  });

  // Prioridade: Dias Ativos (Constância) > Média de Anúncios (Escala)
  processedOffers.sort((a, b) => {
    if (b.dias_ativos !== a.dias_ativos) return b.dias_ativos - a.dias_ativos;
    return b.media_anuncios - a.media_anuncios;
  });

  const finalResults = processedOffers.filter(o => o.dias_ativos > 0);

  console.log('---JSON_START---');
  console.log(JSON.stringify(finalResults, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
