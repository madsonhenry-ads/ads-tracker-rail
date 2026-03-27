import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as path from 'path';

puppeteer.use(StealthPlugin());

// Usa o perfil do Chrome do usuário para herdar o login do Facebook
const CHROME_USER_DATA = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\madso\\AppData\\Local',
  'Google\\Chrome\\User Data'
);

const CHAMPION_ADS = [
  { id: '1677585033608190', label: 'Campeão #1 (mulher falando)', started: 'Mar 4' },
  { id: '1276403394381230', label: 'Campeão #2 (personagem animado)', started: 'Mar 4' },
];

async function getImpressionsForAd(browser: any, adId: string, label: string) {
  const url = `https://www.facebook.com/ads/library/?id=${adId}`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
    await new Promise(r => setTimeout(r, 5000));

    // Clica em "See ad details" para abrir os detalhes completos
    try {
      const btn = await page.$('button[type="button"]');
      if (btn) {
        const btnText = await page.evaluate((el: any) => el.textContent, btn);
        if (btnText?.includes('See ad details')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    } catch(e) {}

    await page.screenshot({ path: `./champion_${adId}_details.png`, fullPage: true });

    const text = await page.evaluate(() => document.body.innerText);

    // Procura por padrões de impressão
    const impressionPatterns = [
      /(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)\s*impressions/gi,
      /(\d[\d,]*)\s*impressions/gi,
      /impressions:\s*(\d[\d,]*)/gi,
      /(\d[\d,]*)\s*to\s*(\d[\d,]*)\s*impressions/gi,
    ];

    let impressions = 'Não encontrado';
    for (const pattern of impressionPatterns) {
      const match = text.match(pattern);
      if (match) {
        impressions = match[0];
        break;
      }
    }

    // Extrai trecho relevante sobre impressões
    const lines = text.split('\n');
    const impressionLines = lines.filter((l: string) =>
      l.toLowerCase().includes('impression') ||
      l.toLowerCase().includes('reach') ||
      l.toLowerCase().includes('spend') ||
      l.toLowerCase().includes('started running') ||
      l.toLowerCase().includes('active')
    );

    return { id: adId, label, impressions, relevantLines: impressionLines.slice(0, 15), rawText: text.slice(0, 3000) };
  } catch (err: any) {
    return { id: adId, label, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🔐 Abrindo Chrome com perfil do usuário (Facebook logado)...\n');

  let browser: any;

  try {
    // Tenta usar o perfil do Chrome existente
    browser = await (puppeteer as any).launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: CHROME_USER_DATA,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--profile-directory=Default',
      ],
    });
  } catch (err) {
    console.log('⚠️ Não conseguiu abrir com perfil do Chrome. Tentando sem perfil...');
    browser = await (puppeteer as any).launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  for (const ad of CHAMPION_ADS) {
    console.log(`\n🔍 ${ad.label} (ID: ${ad.id})`);
    console.log(`   Ativo desde: ${ad.started}, 2026`);

    const result = await getImpressionsForAd(browser, ad.id, ad.label);

    if (result.error) {
      console.log(`   ❌ Erro: ${result.error}`);
    } else {
      console.log(`   📊 Impressões: ${result.impressions}`);
      if (result.relevantLines?.length) {
        console.log('   📋 Dados relevantes:');
        result.relevantLines.forEach((l: string) => {
          if (l.trim()) console.log(`     → ${l.trim()}`);
        });
      }
    }
  }

  console.log('\n✅ Screenshots salvas em: backend/champion_*_details.png');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
