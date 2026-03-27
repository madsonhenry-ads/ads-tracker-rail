import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// Anúncios EN com URL visível (CLICK.THEOBEDIENCELANGUAGE.COM) identificados na análise anterior
// Começando pelos mais antigos (Mar 4, 2026) que são os prováveis campeões
const EN_ADS = [
  { id: '1677585033608190', started: 'Mar 4, 2026', note: 'Oldest EN ad #1 - cartoons copy' },
  { id: '1276403394381230', started: 'Mar 4, 2026', note: 'Oldest EN ad #2 - cartoons copy' },
  { id: '1262211386061620', started: 'Mar 20, 2026', note: 'Recent EN - cartoons copy' },
  { id: '1227373219384236', started: 'Mar 20, 2026', note: 'Recent EN - cartoons copy' },
];

async function getAdDetails(browser: any, adId: string) {
  const url = `https://www.facebook.com/ads/library/?id=${adId}`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    const text = await page.evaluate(() => document.body.innerText);
    
    // Salva screenshot
    await page.screenshot({ path: `./ad_champion_${adId}.png`, fullPage: false });
    
    // Extrai info relevante
    const impressionMatch = text.match(/[\d,]+ - [\d,]+ impressions|[\d,]+ impressions/i);
    const dateMatch = text.match(/Started running on ([^\n]+)/i);
    const platformMatch = text.match(/Platforms[^\n]*\n([^\n]+)/);
    
    return {
      id: adId,
      url,
      impressions: impressionMatch ? impressionMatch[0] : 'não visível (requer login)',
      startDate: dateMatch ? dateMatch[1] : 'unknown',
      rawSnippet: text.slice(0, 2000),
    };
  } catch (err: any) {
    return { id: adId, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🏆 Buscando o anúncio CAMPEÃO do funil EN (click.theobediencelanguage.com)\n');
  
  const browser = await (puppeteer as any).launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const ad of EN_ADS) {
    console.log(`\n📋 Verificando: ${ad.id}`);
    console.log(`   Iniciado em: ${ad.started} | ${ad.note}`);
    console.log(`   URL: https://www.facebook.com/ads/library/?id=${ad.id}`);
    
    const details = await getAdDetails(browser, ad.id);
    console.log(`   Impressões: ${details.impressions}`);
    
    if (details.rawSnippet) {
      // Extrai e mostra partes relevantes do texto
      const lines = details.rawSnippet.split('\n').filter((l: string) => l.trim());
      const relevantLines = lines.filter((l: string) => 
        l.includes('impression') || 
        l.includes('Started') || 
        l.includes('Platform') ||
        l.includes('theobedience') ||
        l.includes('Learn more') ||
        l.includes('CLICK')
      );
      console.log('   Dados relevantes:');
      relevantLines.forEach((l: string) => console.log(`     → ${l.trim()}`));
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n\n📸 Screenshots salvas em: backend/ad_champion_*.png');
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
