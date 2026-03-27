
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.page.count();
        console.log(`Total active pages in DB: ${count}`);
        const pages = await prisma.page.findMany({ take: 5 });
        console.log('Sample pages:', JSON.stringify(pages, null, 2));
    } catch (error) {
        console.error('Error connecting to DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
