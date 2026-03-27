import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetOffers = [
    "Lays Sant'anna",
    "Michelle Bottrel - English",
    "Dra. Vanderléa Coelho"
  ];

  for (const offerName of targetOffers) {
    console.log(`\n==================================================`);
    console.log(`🔍 ANALISANDO: ${offerName.toUpperCase()}`);
    console.log(`==================================================`);

    const page = await prisma.page.findFirst({
      where: { name: { contains: offerName, mode: 'insensitive' } },
      include: {
        adSnapshots: {
          orderBy: { timestamp: 'desc' },
          take: 3
        }
      }
    });

    if (!page || page.adSnapshots.length === 0) {
      console.log('Nenhum snapshot encontrado.');
      continue;
    }

    page.adSnapshots.forEach((ad, index) => {
      console.log(`\n--- CRIATIVO ${index + 1} ---`);
      console.log(`📅 Capturado em: ${ad.timestamp}`);
      console.log(`📝 CÓPIA:\n${ad.adText || 'Sem texto disponível'}`);
      if (ad.imageUrl) console.log(`🖼️ Imagem: ${ad.imageUrl}`);
      if (ad.videoUrl) console.log(`🎥 Vídeo: ${ad.videoUrl}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
