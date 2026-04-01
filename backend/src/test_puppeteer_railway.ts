import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

// @ts-ignore
puppeteer.use(StealthPlugin());

async function testLaunch() {
    console.log('🚀 Iniciando teste de lançamento do Puppeteer...');
    console.log(`💻 Plataforma: ${process.platform}`);

    const launchArgs = [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process'
    ];

    let executablePath: string | undefined = undefined;

    if (process.platform === 'linux') {
        const commonPaths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ];
        
        for (const path of commonPaths) {
            if (fs.existsSync(path)) {
                executablePath = path;
                console.log(`✅ Navegador do sistema encontrado em: ${executablePath}`);
                break;
            }
        }
        
        if (!executablePath) {
            console.log('❌ Nenhum navegador do sistema encontrado nos caminhos padrão.');
        }
    }

    try {
        console.log('🎬 Tentando lançar o navegador...');
        const browser = await (puppeteer as any).launch({
            headless: true,
            executablePath,
            args: launchArgs
        });

        console.log('✅ Navegador lançado com sucesso!');
        const page = await browser.newPage();
        await page.goto('https://www.google.com');
        console.log(`✅ Página carregada: ${await page.title()}`);
        
        await browser.close();
        console.log('🏁 Teste concluído com sucesso!');
    } catch (error: any) {
        console.error('❌ FALHA NO TESTE:');
        console.error(error.stack || error.message);
        process.exit(1);
    }
}

testLaunch();
