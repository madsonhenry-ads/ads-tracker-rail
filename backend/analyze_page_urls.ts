import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const PAGE_ID = '546590051870562';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

interface AdData {
  id: string;
  ad_snapshot_url?: string;
  ad_creative_link_caption?: string;
  languages?: string[];
  delivery_by_region?: Array<{ region: string; impression_ratio: number }>;
}

async function fetchAds(afterCursor?: string): Promise<any> {
  const params: any = {
    access_token: ACCESS_TOKEN,
    ad_type: 'ALL',
    ad_active_status: 'ACTIVE',
    search_page_ids: PAGE_ID,
    fields: 'id,ad_snapshot_url,ad_creative_link_caption,languages,delivery_by_region',
    limit: 100,
  };
  if (afterCursor) params.after = afterCursor;

  const res = await axios.get('https://graph.facebook.com/v21.0/ads_archive', { params });
  return res.data;
}

async function main() {
  console.log(`\n🔍 Buscando anúncios ativos da página ${PAGE_ID}...\n`);

  const urlCount: Record<string, number> = {};
  const urlLanguages: Record<string, Set<string>> = {};
  let totalAds = 0;
  let cursor: string | undefined;

  do {
    const data = await fetchAds(cursor);
    const ads: AdData[] = data.data || [];
    totalAds += ads.length;

    for (const ad of ads) {
      // Extrai a URL de destino do snapshot URL
      const snapshotUrl = ad.ad_snapshot_url || '';
      
      // Pega a URL de link do criativo
      const linkCaption = ad.ad_creative_link_caption || '';
      
      // Tenta extrair domínio/URL da caption
      let targetUrl = linkCaption || 'unknown';
      
      // Conta por URL
      urlCount[targetUrl] = (urlCount[targetUrl] || 0) + 1;
      
      // Registra idiomas
      if (!urlLanguages[targetUrl]) urlLanguages[targetUrl] = new Set();
      const langs = ad.languages || [];
      langs.forEach(l => urlLanguages[targetUrl].add(l));
    }

    cursor = data.paging?.cursors?.after;
    const hasNext = data.paging?.next;
    if (!hasNext) break;

    console.log(`   Buscados ${totalAds} anúncios até agora...`);
    await new Promise(r => setTimeout(r, 500));
  } while (cursor);

  // Ordena por contagem
  const sorted = Object.entries(urlCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  console.log(`\n📊 TOTAL DE ANÚNCIOS ATIVOS: ${totalAds}\n`);
  console.log('🔗 TOP URLs COM MAIS ANÚNCIOS ATIVOS:\n');
  console.log('─'.repeat(80));

  sorted.forEach(([url, count], i) => {
    const langs = Array.from(urlLanguages[url] || []);
    const langStr = langs.length > 0 ? langs.join(', ') : 'não identificado';
    const isBR = langs.some(l => l.toLowerCase().includes('pt'));
    const isEN = langs.some(l => l.toLowerCase().includes('en'));
    const idioma = isBR && isEN ? '🌐 PT + EN' : isBR ? '🇧🇷 PT-BR' : isEN ? '🇺🇸 EN' : `❓ ${langStr}`;
    
    console.log(`${i + 1}. [${count} anúncios] ${idioma}`);
    console.log(`   URL: ${url}`);
    console.log();
  });
}

main().catch(err => {
  console.error('Erro:', err.response?.data || err.message);
  process.exit(1);
});
