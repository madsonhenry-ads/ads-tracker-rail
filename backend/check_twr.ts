import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const PROXY_HOST = process.env.PRIVATEPROXY_HOST || '89.46.0.154';
const PROXY_PORT = process.env.PRIVATEPROXY_PORT || '5432';
const PROXY_USER = process.env.PRIVATEPROXY_USER || 'lsy5p';
const PROXY_PASS = process.env.PRIVATEPROXY_PASS || 'z16h33mo';

const URLS = [
    'https://ckr.winbackyourexnow.com/3u1owfjike/',
    'https://ckr.winbackyourexnow.com/8nm8elwlkn/',
    'http://ckr.winbackyourexnow.com/',
    'https://ckr.winbackyourexnow.com/yn4t9owwjv/',
    'https://ckr.winbackyourexnow.com/3dfgdhenps/',
    'https://ckr.winbackyourexnow.com/vmzqp88ucj/',
    'https://ckr.winbackyourexnow.com/3dfgdhenps'
];

async function main() {
    console.log(`🚀 Iniciando investigação de ${URLS.length} URLs TWR...`);
    console.log(`🌐 Usando Proxy: ${PROXY_HOST}:${PROXY_PORT}`);

    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'twr');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Autenticação do Proxy
        await page.authenticate({
            username: PROXY_USER,
            password: PROXY_PASS
        });

        // Simulação Mobile (iPhone 13)
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

        // Referrer Spoofing (Meta Ads style)
        await page.setExtraHTTPHeaders({
            'Referer': 'https://l.facebook.com/',
            'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7'
        });

        for (const [index, startUrl] of URLS.entries()) {
            console.log(`\n🔍 [${index + 1}/${URLS.length}] Investigando: ${startUrl}`);
            
            try {
                // Navegação com seguimento de redirecionamentos
                const response = await page.goto(startUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });

                const finalUrl = page.url();
                const title = await page.title();
                
                console.log(`   ✅ Final URL: ${finalUrl}`);
                console.log(`   📝 Title: ${title}`);

                // Scroll para carregar conteúdo (VSLs etc)
                await page.evaluate(async () => {
                    await new Promise<void>((resolve) => {
                        let totalHeight = 0;
                        const distance = 100;
                        const timer = setInterval(() => {
                            const scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 100);
                    });
                });

                // Screenshot para confirmação visual
                const screenshotName = `twr_${index + 1}_${new URL(startUrl).pathname.replace(/\//g, '') || 'root'}.png`;
                const screenshotPath = path.join(screenshotsDir, screenshotName);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`   📸 Screenshot salvo: ${screenshotPath}`);

            } catch (error: any) {
                console.error(`   ❌ Falha ao investigar ${startUrl}: ${error.message}`);
            }
        }

    } catch (error: any) {
        console.error(`🚨 Fatal Error: ${error.message}`);
    } finally {
        await browser.close();
        console.log('\n✨ Investigação finalizada.');
    }
}

main();
