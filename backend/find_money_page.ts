import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// Configurações do Proxy
const PROXY_HOST = process.env.PRIVATEPROXY_HOST;
const PROXY_PORT = process.env.PRIVATEPROXY_PORT;
const PROXY_USER = process.env.PRIVATEPROXY_USER;
const PROXY_PASS = process.env.PRIVATEPROXY_PASS;

// URL COM PARÂMETROS DE RASTREAMENTO (FORNECIDA PELO USUÁRIO)
const BASE_URL = 'https://go.myaiwealthcreation.com/698cd4c098e17441ba4e6d16';

// User-Agent de Elite (FB In-App / Liger Signature)
const FBIOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/451.0.0.44.110;FBBV/568326230;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5;FBRV/0]';

async function main() {
    console.log('🎯 [FULL TRACKING BYPASS] Iniciando simulação de clique de anúncio real...');
    console.log(`🌐 Proxy IP: ${PROXY_HOST} (US Residential)`);

    const logDir = path.join(process.cwd(), 'investigation_results');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY_USER || '', password: PROXY_PASS || '' });

        // Sincronização de Timezone (Nova York)
        await page.emulateTimezone('America/New_York');

        // Grampo de Rede
        page.on('response', (response) => {
            const url = response.url();
            const status = response.status();
            const headers = response.headers();
            if (status >= 300 && status <= 399 && headers['location']) {
                console.log(`🚀 [REDIRECT] ${status} -> ${headers['location']}`);
                fs.appendFileSync(path.join(logDir, 'tracking_chain.log'), `[${new Date().toISOString()}] ${url} -> ${headers['location']}\n`);
            }
        });

        // TÉCNICA LIGER: Injeção de cabeçalhos mobile oficiais
        await page.setExtraHTTPHeaders({
            'referer': 'https://l.facebook.com/',
            'X-FB-HTTP-Engine': 'Liger',
            'X-ASBD-ID': '198389',
            'X-FB-Client-IP': PROXY_HOST || '',
            'X-Forwarded-For': PROXY_HOST || '',
            'Accept-Language': 'en-US,en;q=0.9'
        });

        await page.setUserAgent(FBIOS_UA);
        
        // Simulação de Dados de Rastreamento (Para enganar o TWR)
        const fbclid = 'IwAR' + Math.random().toString(36).substring(2, 18);
        const params = new URLSearchParams({
            'sub1': '110444158047660', // Ad ID real
            'sub2': '238541298457',      // Simulação Adset ID
            'sub3': '62938475621',       // Simulação Campaign ID
            'sub4': 'TheHelpVault_Ad',   // Ad Name
            'sub5': 'US_Broad_Audience', // Adset Name
            'sub6': 'Sales_Global_2026', // Campaign Name
            'sub7': 'Facebook_Mobile_Feed',
            'sub8': 'fb',
            'utm_source': 'facebook',
            'utm_medium': 'paid',
            'fbclid': fbclid
        });

        const targetUrl = `${BASE_URL}?${params.toString()}`;

        console.log(`🔍 Disparando Clique Simulado: ${targetUrl}`);
        
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Simulação de "Dwell Time" (Comportamento Humano)
        console.log('   ⏳ Simulando análise humana do conteúdo (45s)...');
        await new Promise(r => setTimeout(r, 45000));

        const finalUrl = page.url();
        const content = await page.content();
        
        fs.writeFileSync(path.join(logDir, 'v3_final_content.html'), content);
        await page.screenshot({ path: path.join(logDir, `v3_result_${Date.now()}.png`), fullPage: true });

        console.log(`\n📍 URL Final Alcançada: ${finalUrl}`);
        if (finalUrl.includes('/du/')) {
            console.log('❌ TWR RESISTIU: Ainda fomos redirecionados para o Blog Seguro.');
        } else {
            console.log('✅ SUCESSO? A URL final não contém /du/.');
        }

    } catch (error: any) {
        console.error('🚨 ERRO NO BYPASS V3:', error.message);
    } finally {
        await browser.close();
    }
}

main();
