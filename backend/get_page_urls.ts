import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetOffers = [
    "Lays Sant'anna",
    "Michelle Bottrel - English",
    "Dra. Vanderléa Coelho"
  ];

  const results = [];
  for (const offerName of targetOffers) {
    const page = await prisma.page.findFirst({
      where: { name: { contains: offerName, mode: 'insensitive' } },
      select: { id: true, name: true, url: true, facebookPageId: true }
    });
    if (page) results.push(page);
  }

  console.log('---JSON_START---');
  console.log(JSON.stringify(results, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
