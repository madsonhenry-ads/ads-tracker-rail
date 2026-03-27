import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({
    take: 10,
    select: { name: true, category: true, _count: { select: { metrics: true } } }
  });
  console.log('Pages Sample:', JSON.stringify(pages, null, 2));

  const categories = await prisma.page.groupBy({
    by: ['category'],
    where: { category: { not: null } },
    _count: { _all: true }
  });
  console.log('Categories:', JSON.stringify(categories, null, 2));
}

main().finally(() => prisma.$disconnect());
