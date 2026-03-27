import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const CHAMPION_ADS = [
  { id: '1677585033608190', label: 'Campeão #1 (mulher falando - cartoons copy)' },
  { id: '1276403394381230', label: 'Campeão #2 (personagem animado - cartoons copy)' },
];

async function main() {
  console.log('🔗 Conectando ao Chrome já aberto com debug port 9222...\n');

  const browser = await (puppeteer as any).connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });

  const pages = await browser.pages();
  console.log(`📄 Páginas abertas no Chrome: ${pages.length}`);

  for (const ad of CHAMPION_ADS) {
    const url = `https://www.facebook.com/ads/library/?id=${ad.id}`;
    console.log(`\n🔍 ${ad.label}`);
    console.log(`   Abrindo: ${url}`);

    // Reutiliza uma aba existente ou abre nova
    let page = pages.find((p: any) => p.url().includes(ad.id));
    if (!page) {
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
      await new Promise(r => setTimeout(r, 5000));
    }

    // Clica em "See ad details" se existir
    try {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('div[role="button"], button')];
        const detailBtn = btns.find(b => b.textContent?.includes('See ad details'));
        if (detailBtn) (detailBtn as HTMLElement).click();
      });
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {}

    // Captura screenshot
    await page.screenshot({ path: `./loggedin_${ad.id}.png`, fullPage: false });

    // Extrai texto
    const text: string = await page.evaluate(() => document.body.innerText);

    // Busca impressões
    const impressionPattern = /[\d,]+\s*[-–]\s*[\d,]+\s*impressi|[\d,]+\s*impressi/gi;
    const matches = text.match(impressionPattern);

    console.log(`   📊 Impressões: ${matches ? matches.join(' | ') : 'Não encontrado no texto'}`);

    // Exibe linhas relevantes
    const lines = text.split('\n').filter(l => l.trim());
    const relevant = lines.filter(l =>
      l.toLowerCase().includes('impression') ||
      l.toLowerCase().includes('started running') ||
      l.toLowerCase().includes('active') ||
      l.toLowerCase().includes('reach')
    );
    console.log('   📋 Dados relevantes:');
    relevant.slice(0, 10).forEach(l => console.log(`     → ${l.trim()}`));
  }

  console.log('\n✅ Pronto! Screenshots salvas em: loggedin_*.png');
  await browser.disconnect();
}

main().catch(async err => {
  console.error('❌ Erro ao conectar ao Chrome via debug port:', err.message);
  console.log('\n💡 Alternativa: Abrindo com perfil do usuário diretamente...');
  process.exit(1);
});
