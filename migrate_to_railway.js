/**
 * Script de Migração: Restaurar páginas no Railway PostgreSQL
 * 
 * Este script:
 * 1. Limpa as páginas de exemplo do Railway
 * 2. Insere todas as páginas reais com seus Facebook Page IDs
 * 3. Usa a API do backend Railway para adicionar cada página
 */

const RAILWAY_BACKEND_URL = 'https://backend-production-985ae.up.railway.app';

// Dados recuperados dos logs e arquivos de ranking
// Formato: [facebookPageId, nome, categoria]
const PAGES_TO_RESTORE = [
  // === CONFIRMADOS (nome exato dos logs) ===
  ['109500121585226', 'Esp. Maria Carla', 'EMAGRECIMENTO'],
  ['933471156527267', 'Mente Próspera', 'MINDFULLNESS'],
  ['524207520784029', 'Renata Moretti', 'RELACIONAMENTO'],
  ['659864613870626', 'Padre Bento Moreira', 'RELIGIOSO'],
  ['103529912804950', 'Maria Costantine', 'EMAGRECIMENTO'],
  ['470960239428964', 'Fernanda Araújo', 'EMAGRECIMENTO'],
  ['798810959976718', 'El Secreto para Recuperar a Tu Ex', 'RELACIONAMENTO'],
  ['768479759691779', 'Fabricantes Chinos', 'RENDA-EXTRA'],
  
  // === PÁGINAS DO RANKING (mapeamento por nome da oferta) ===
  ['2016271568674266', "Lays Sant'anna", 'EMAGRECIMENTO'],
  ['546590051870562', 'Michelle Bottrel - English', 'MATERNIDADE'],
  ['137986639725842', 'Dra. Vanderléa Coelho', 'EMAGRECIMENTO'],
  
  // === PÁGINAS RESTANTES (IDs dos logs, precisam nomes reais) ===
  ['111638323856452', 'Viva Leve Mulher', 'EMAGRECIMENTO'],
  ['714614625066801', 'Nutri Marina Cardoso', 'EMAGRECIMENTO'],
  ['878346578692619', 'Silvia Vieira', 'MINDFULLNESS'],
  ['730644303465596', 'Lucia Helena', 'MINDFULLNESS'],
  ['100315868604123', 'Ancient Remedies', 'HEALTH'],
  ['844864115370211', 'Dr. Hiroshi Tanaka', 'EMAGRECIMENTO'],
  ['713830091813741', 'Maria Lucía', 'EMAGRECIMENTO'],
  ['284831244705211', 'Olivia Carla Aragão', 'EMAGRECIMENTO'],
  ['887895511075179', 'Sophia Williams', 'RELACIONAMENTO'],
  ['886254281237555', 'Dra. Sofía Martínez', 'HEALING'],
  ['659419983931891', 'Clara Méndez', 'RELACIONAMENTO'],
  ['108230692119092', 'Beatriz Antonele', 'RELACIONAMENTO'],
  ['505147706019447', 'Logler5', 'SPY'],
  ['104226435327267', 'Velapp', 'SPY'],
  ['557088884144411', 'Lognex1', 'SPY'],
  ['102507296211697', 'Scrnax5', 'SPY'],
  ['710346542159217', 'Screnax4', 'SPY'],
  ['737740246978395', 'Thomas Miller', 'PRODUTIVIDADE'],
  ['719968614538912', 'Christian Knowledge', 'RELIGIOSO'],
  ['830592383469676', 'Codebigpage', 'SPY'],
  ['869039372965532', 'Fátima Andrade Silva', 'RELIGIOSO'],
  ['416061424920119', 'CodeApp2', 'SPY'],
  ['931678906685872', 'Paul Coyle Davis', 'PRODUTIVIDADE'],
  ['855663220964583', 'Camunidad Árbol De La Vida', 'RELIGIOSO'],
  ['860961133769608', 'Maria Torrez', 'EMAGRECIMENTO'],
  ['864778383383327', 'Bruna santos', 'RELIGIOSO'],
  ['926113033923066', 'Kairos Digital', 'RELIGIOSO'],
  ['922745177583908', 'Be Welly', 'DIABETES'],
  ['105500745163459', 'Isabella Torres', 'RENDA EXTRA'],
  ['663099610229816', 'Livro Mágico Infantil', 'INFANTIL'],
  ['294349290425520', 'Instituto Vida Sana', 'EMAGRECIMENTO'],
  ['878392202033886', 'Health Standard', 'DIABETE'],
  ['152320571306475', 'Michael Thompson', 'RENDA EXTRA'],
  ['937608952767507', 'Health Life', 'EMAGRECIMENTO'],
  ['676647748861348', 'Sandro Nature', 'INTESTINO'],
  ['544616248732745', 'Valeria Montes', 'EMAGRECIMENTO'],
  ['519363534921552', 'Julia Silva', 'EMAGRECIMENTO'],
  ['107666871360862', 'Fantasy IA', 'HEALING'],
  ['159506237240758', 'Isabella Souza', 'EMAGRECIMENTO'],
  ['225404210655275', 'Emily Anderson', 'RENDA EXTRA'],
  ['Laura Sofia FB Page', 'Laura Sofia', 'EMAGRECIMENTO'],  // ID precisa verificação
  ['Isabella Violet FB Page', 'Isabella Violet', 'ED'],  // ID precisa verificação  
  ['Avanço Digital FB Page', 'Avanço Digital', 'RENDA-EXTRA'],  // ID precisa verificação
  ['Noelle Azem FB Page', 'Noelle Azem', 'RELACIONAMENTO'],  // ID precisa verificação
  ['Nicolas Martin FB Page', 'Nicolas Martin', 'RELACIONAMENTO'],  // ID precisa verificação
];

async function migrate() {
  console.log('🚀 Iniciando migração para Railway...\n');

  // 1. Verificar se o backend está acessível
  console.log('1️⃣ Verificando conexão com o backend Railway...');
  try {
    const healthCheck = await fetch(`${RAILWAY_BACKEND_URL}/api/pages`);
    const healthData = await healthCheck.json();
    console.log(`   ✅ Backend acessível! Páginas atuais: ${healthData.count}`);
    
    // 2. Deletar páginas de exemplo
    if (healthData.data && healthData.data.length > 0) {
      console.log('\n2️⃣ Removendo páginas de exemplo...');
      for (const page of healthData.data) {
        console.log(`   🗑️ Deletando: ${page.name} (${page.facebookPageId})`);
        await fetch(`${RAILWAY_BACKEND_URL}/api/pages/${page.id}`, {
          method: 'DELETE',
        });
      }
      console.log('   ✅ Páginas de exemplo removidas!');
    }
  } catch (err) {
    console.error('❌ Erro ao conectar com o backend:', err.message);
    process.exit(1);
  }

  // 3. Adicionar todas as páginas reais
  console.log('\n3️⃣ Inserindo páginas reais...');
  let successCount = 0;
  let failCount = 0;

  // Filter out pages with placeholder IDs
  const validPages = PAGES_TO_RESTORE.filter(p => /^\d+$/.test(p[0]));
  
  for (const [fbPageId, name, category] of validPages) {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=${fbPageId}`;
    
    try {
      const response = await fetch(`${RAILWAY_BACKEND_URL}/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          url: url,
          category: category,
          country: 'ALL',
          tags: [category.toLowerCase()],
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        successCount++;
        console.log(`   ✅ [${successCount}/${validPages.length}] ${name} (${fbPageId})`);
      } else {
        failCount++;
        console.log(`   ⚠️ FALHA: ${name} - ${result.error}`);
      }
    } catch (err) {
      failCount++;
      console.log(`   ❌ ERRO: ${name} - ${err.message}`);
    }

    // Pequeno delay entre requisições
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Migração concluída!`);
  console.log(`   Sucesso: ${successCount} páginas`);
  console.log(`   Falhas: ${failCount} páginas`);
  console.log(`   Páginas sem ID confirmado: ${PAGES_TO_RESTORE.length - validPages.length}`);
  console.log(`${'='.repeat(50)}`);
}

migrate().catch(console.error);
