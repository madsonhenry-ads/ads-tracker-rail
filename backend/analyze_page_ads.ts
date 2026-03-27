import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());

const URL = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&sort_data%5Bdirection%5D=desc&sort_data%5Bmode%5D=total_impressions&view_all_page_id=546590051870562';

async function main() {
  console.log('🚀 Abrindo browser...');
  
  const browser = await (puppeteer as any).launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=pt-BR'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  console.log('📡 Acessando Facebook Ads Library...');
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Aguarda os anúncios carregarem
  await new Promise(r => setTimeout(r, 5000));

  // Scroll para carregar mais anúncios
  console.log('📜 Fazendo scroll para carregar mais anúncios...');
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 1200));
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write(`   Scroll ${i + 1}/8...\r`);
  }
  console.log('\n');

  await new Promise(r => setTimeout(r, 3000));

  // Extrai dados dos anúncios
  const results = await page.evaluate(() => {
    const ads = document.querySelectorAll('[data-testid="ad-archive-renderer"], ._7jyr, .x1qjc9v5, ._6f6r');
    
    const data: any[] = [];
    
    // Tenta pegar todas as seções de anúncio
    const adContainers = document.querySelectorAll('[class*="x1qjc9v5"]');
    
    // Captura todos os links visíveis nos anúncios
    const links = document.querySelectorAll('a[href*="l.facebook.com"], a[href*="://"], [class*="_7jyx"] a, [class*="x4k7w5x"] a');
    
    // Captura textos dos anúncios
    const adTexts: string[] = [];
    document.querySelectorAll('._7jyx, [data-testid="ad-archive-renderer"]').forEach(el => {
      adTexts.push(el.textContent?.slice(0, 500) || '');
    });

    // Extrai todos os links/captions de URL nos anúncios (geralmente aparecem como domínios)
    const urlCaptions: string[] = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim() || '';
      // Identifica elementos que contêm domínios (ex: "site.com.br", "site.com")
      if (text.match(/^[a-zA-Z0-9-]+\.(com\.br|com|io|net|org)(\/[^\s]*)?$/) && el.children.length === 0) {
        urlCaptions.push(text);
      }
    });

    // Botões CTA
    const ctaButtons: string[] = [];
    document.querySelectorAll('._56bs, [role="button"]').forEach(el => {
      const t = el.textContent?.trim() || '';
      if (t && t.length < 40) ctaButtons.push(t);
    });

    return {
      adCount: document.querySelectorAll('[data-testid="ad-archive-renderer"]').length,
      urlCaptions: [...new Set(urlCaptions)],
      ctaButtons: [...new Set(ctaButtons)].slice(0, 20),
      pageTitle: document.title,
      // Tenta capturar qualquer texto que pareça URL
      rawPageText: document.body.innerText.slice(0, 50000),
    };
  });

  console.log('📊 RESULTADO DA ANÁLISE\n');
  console.log('Título da página:', results.pageTitle);
  console.log('Anúncios encontrados (testid):', results.adCount);
  console.log('\n🔗 URLs/Domínios encontrados:');
  results.urlCaptions.forEach((u: string) => console.log('  -', u));
  console.log('\n🔘 Botões CTA encontrados:');
  results.ctaButtons.slice(0, 15).forEach((b: string) => console.log('  -', b));

  // Analisa o texto bruto para encontrar URLs e idioma
  const rawText = results.rawPageText as string;
  
  // Extrai URLs que aparecem no texto
  const urlMatches = rawText.match(/https?:\/\/[a-zA-Z0-9-_./?=&#%]+/g) || [];
  const domainMatches = rawText.match(/[a-zA-Z0-9-]+\.(com\.br|com\/[a-z]{2,}|io\/[a-z]{2,})[^\s]*/g) || [];
  
  const urlFreq: Record<string, number> = {};
  [...urlMatches, ...domainMatches].forEach(url => {
    // Normaliza
    try {
      const domain = url.replace(/https?:\/\//, '').split('/')[0].replace('www.', '');
      if (domain && !domain.includes('facebook') && !domain.includes('fb.com') && domain.length > 4) {
        urlFreq[domain] = (urlFreq[domain] || 0) + 1;
      }
    } catch(e) {}
  });

  const sortedUrls = Object.entries(urlFreq).sort(([,a],[,b]) => b-a).slice(0, 20);
  
  console.log('\n🌐 Domínios externos detectados no texto da página:');
  sortedUrls.forEach(([url, count]) => {
    console.log(`  ${count}x  ${url}`);
  });

  // Detecta idioma
  const ptWords = (rawText.match(/\b(clique|acesse|compre|oferta|grátis|agora|saiba|mais|para|como|você|novo|descubra|aproveite|exclusivo|especial|hoje)\b/gi) || []).length;
  const enWords = (rawText.match(/\b(click|shop|buy|now|free|learn|more|get|new|discover|exclusive|special|today|checkout|order)\b/gi) || []).length;
  
  console.log(`\n🗣️ ANÁLISE DE IDIOMA:`);
  console.log(`  Palavras PT-BR detectadas: ${ptWords}`);
  console.log(`  Palavras EN detectadas: ${enWords}`);
  console.log(`  Idioma predominante: ${ptWords > enWords ? '🇧🇷 PORTUGUÊS (PT-BR)' : enWords > ptWords ? '🇺🇸 INGLÊS (EN)' : '⚖️ MISTURA PT + EN'}`);

  // Salva o texto bruto para análise manual
  const fs = await import('fs');
  fs.writeFileSync('./page_ads_raw.txt', rawText, 'utf8');
  console.log('\n💾 Texto completo salvo em: page_ads_raw.txt');

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
