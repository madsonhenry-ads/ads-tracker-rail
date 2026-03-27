import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

puppeteer.use(StealthPlugin());

const PROXY_HOST = process.env.PRIVATEPROXY_HOST || '89.46.0.154';
const PROXY_PORT = process.env.PRIVATEPROXY_PORT || '5432';
const PROXY_USER = process.env.PRIVATEPROXY_USER || 'lsy5p';
const PROXY_PASS = process.env.PRIVATEPROXY_PASS || 'z16h33mo';
const PROXY_API_KEY = process.env.PRIVATEPROXY_API_KEY || '';

const URLS = [
    'https://ckr.winbackyourexnow.com/3u1owfjike/',
    'https://ckr.winbackyourexnow.com/8nm8elwlkn/',
    'http://ckr.winbackyourexnow.com/',
    'https://ckr.winbackyourexnow.com/yn4t9owwjv/',
    'https://ckr.winbackyourexnow.com/3dfgdhenps/',
    'https://ckr.winbackyourexnow.com/vmzqp88ucj/',
    'https://ckr.winbackyourexnow.com/3dfgdhenps'
];

async function swapProxyIp() {
    if (!PROXY_API_KEY) return false;
    try {
        console.log('🔄 Trocando IP do Proxy via API...');
        const response = await axios.get('https://app.privateproxy.me/api/v1/package_subscriptions', {
            auth: { username: 'api', password: PROXY_API_KEY }
        });
        const activeSub = response.data.find((s: any) => s.active);
        if (activeSub) {
            await axios.get(`https://app.privateproxy.me/api/v1/package_subscriptions/${activeSub.id}/ips`, {
                auth: { username: 'api', password: PROXY_API_KEY }
            });
            console.log('✅ Comando de troca de IP enviado.');
            return true;
        }
    } catch (e: any) {
        console.error('❌ Erro ao trocar IP:', e.message);
    }
    return false;
}

async function main() {
    console.log(`🚀 Iniciando tentativa de BYPASS para ${URLS.length} URLs TWR...`);

    // Tentar trocar IP antes de começar para evitar bans prévios
    await swapProxyIp();
    await new Promise(r => setTimeout(r, 5000)); // Esperar o proxy atualizar

    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'twr_bypass');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`
        ]
    });

    try {
        const page = await browser.newPage();
        const cursor = createCursor(page);
        
        await page.authenticate({ username: PROXY_USER, password: PROXY_PASS });

        // User Agent mais recente
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });

        for (const [index, startUrl] of URLS.entries()) {
            console.log(`\n🔍 [${index + 1}/${URLS.length}] Tentando Bypass: ${startUrl}`);
            
            try {
                // Referer Spoofing
                await page.setExtraHTTPHeaders({
                    'referer': 'https://l.facebook.com/',
                    'accept-language': 'en-US,en;q=0.9'
                });

                await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });

                // 1. Verificar se há botão de Bridge/Captcha
                const bridgeButton = await page.evaluate(() => {
                    const keywords = ['robot', 'continue', 'clique', 'pressione', 'acessar', 'proceed', 'check'];
                    const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span, input[type="button"], input[type="submit"]'));
                    const target = elements.find(el => {
                        const text = el.textContent?.trim().toLowerCase() || (el as HTMLInputElement).value?.toLowerCase() || '';
                        return keywords.some(k => text.includes(k));
                    });
                    if (target) {
                        const rect = target.getBoundingClientRect();
                        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, found: true };
                    }
                    return { found: false };
                });

                if (bridgeButton.found && bridgeButton.x > 0 && bridgeButton.y > 0) {
                    console.log(`   🖱️ Botão de Bridge detectado em (${bridgeButton.x}, ${bridgeButton.y})! Tentando clicar...`);
                    try {
                        await cursor.click({ x: bridgeButton.x, y: bridgeButton.y });
                        console.log('   ⏳ Aguardando redirecionamento pós-clique...');
                        await new Promise(r => setTimeout(r, 8000));
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
                    } catch (clickErr: any) {
                        console.error(`   ⚠️ Erro ao clicar no botão: ${clickErr.message}`);
                    }
                }

                // 2. Analisar destino final
                const finalUrl = page.url();
                const title = await page.title();
                const content = await page.content();
                console.log(`   ✅ URL Final: ${finalUrl}`);
                console.log(`   🏷️ Título: ${title}`);

                if (content.toLowerCase().includes('instagram.com')) {
                    console.log('   🚫 Cloaking para Instagram detectado.');
                }

                // 3. Scroll Humano
                await page.evaluate(async () => {
                    window.scrollBy(0, 500);
                    await new Promise(r => setTimeout(r, 1000));
                    window.scrollBy(0, 1000);
                });

                const screenshotPath = path.join(screenshotsDir, `final_bypass_${index + 1}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`   📸 Screenshot salvo em: ${screenshotPath}`);

            } catch (error: any) {
                console.error(`   ❌ Falha geral na URL: ${error.message}`);
            }
        }

    } finally {
        await browser.close();
    }
}

main();
