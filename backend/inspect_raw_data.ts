import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const snapshot = await prisma.adSnapshot.findFirst({
    where: { page: { name: { contains: 'Lays Sant\'anna', mode: 'insensitive' } } },
    orderBy: { timestamp: 'desc' }
  });

  if (!snapshot) {
    console.log('No snapshot found');
    return;
  }

  console.log('---JSON_START---');
  console.log(JSON.stringify({
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    rawData: snapshot.rawData
  }, null, 2));
  console.log('---JSON_END---');
}

main().finally(() => prisma.$disconnect());
