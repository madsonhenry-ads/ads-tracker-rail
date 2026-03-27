import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const page = await prisma.page.findFirst({
    where: { name: 'Camunidad Árbol De La Vida' },
    include: {
      metrics: {
        orderBy: { date: 'asc' }, // Antigos para novos
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
    history: page.metrics.map(m => ({ date: m.date, ads: m.totalAds, trend: m.trend }))
  }, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
