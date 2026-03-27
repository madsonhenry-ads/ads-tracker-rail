import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({
    where: { name: { contains: 'Vida', mode: 'insensitive' } },
    select: { id: true, name: true, category: true }
  });
  console.log('Pages found:', JSON.stringify(pages, null, 2));
}

main().finally(() => prisma.$disconnect());
