import prisma from './config/database.js';
import logger from './utils/logger.js';

async function main() {
  try {
    // Clear existing data (optional, for development)
    await prisma.metric.deleteMany();
    await prisma.adSnapshot.deleteMany();
    await prisma.page.deleteMany();

    logger.info('Cleared existing pages, snapshots, and metrics data.');

    // Create dummy pages
    const page1 = await prisma.page.create({
      data: {
        name: 'Exemplo de Página 1',
        facebookPageId: '1234567890123456',
        url: 'https://www.facebook.com/ads/library/?id=1234567890123456',
        description: 'Uma página de exemplo para testes',
        country: 'BR',
        language: 'pt',
        category: 'E-commerce',
        tags: ['teste', 'exemplo'],
        scrapePeriod: '8d',
        scrapeFrequency: 'daily',
      },
    });

    const page2 = await prisma.page.create({
      data: {
        name: 'Exemplo de Página 2',
        facebookPageId: '9876543210987654',
        url: 'https://www.facebook.com/ads/library/?id=9876543210987654',
        description: 'Outra página para demonstração',
        country: 'US',
        language: 'en',
        category: 'Marketing',
        tags: ['demo', 'marketing'],
        scrapePeriod: '30d',
        scrapeFrequency: 'weekly',
      },
    });

    logger.info('Two dummy pages created successfully.');

    // Optionally create some dummy snapshots and metrics
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      await prisma.adSnapshot.create({
        data: {
          pageId: page1.id,
          totalAds: 100 + Math.floor(Math.random() * 50),
          timestamp: date,
          date: date,
          collectionPeriod: '8d',
          success: true,
        },
      });

      await prisma.adSnapshot.create({
        data: {
          pageId: page2.id,
          totalAds: 200 + Math.floor(Math.random() * 70),
          timestamp: date,
          date: date,
          collectionPeriod: '30d',
          success: true,
        },
      });

      await prisma.metric.create({
        data: {
          pageId: page1.id,
          date: date,
          totalAds: 100 + Math.floor(Math.random() * 50),
          dailyChange: i === 0 ? 0 : Math.floor(Math.random() * 10) - 5,
        },
      });

      await prisma.metric.create({
        data: {
          pageId: page2.id,
          date: date,
          totalAds: 200 + Math.floor(Math.random() * 70),
          dailyChange: i === 0 ? 0 : Math.floor(Math.random() * 15) - 7,
        },
      });
    }

    logger.info('Dummy snapshots and metrics created successfully.');

  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
