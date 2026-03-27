# Guia Avançado: Como Encontrar Variações "Escondidas" na Ad Library do Facebook

## 1. O que são as "Múltiplas Versões"?
Quando a Ad Library exibe a mensagem **"Este anúncio tem várias versões"**, isso geralmente indica o uso de:
- **Criativo Dinâmico (Dynamic Creative):** O Facebook testa diferentes combinações de texto, título e mídia.
- **Anúncios de Catálogo (DPA):** O criativo muda conforme o produto do catálogo que está sendo exibido para o usuário.
- **Otimização de Ativos por Posicionamento:** Versões diferentes para Reels, Stories, Feed, etc.

## 2. Como Visualizar as Variações (Método Manual Avançado)
A interface padrão esconde a maioria das variações, mas você pode forçar a exibição:

### A. Botão "Ver Detalhes do Resumo" (See Summary Details)
1. Clique em **"Ver detalhes do resumo"** no card do anúncio.
2. Uma sobreposição (overlay) será aberta mostrando uma lista de IDs de anúncios individuais que compõem esse grupo.
3. Cada ID ali representa uma versão ativa ou recentemente testada.

### B. O Truque da URL de Snapshot
Cada anúncio tem um ID único. Você pode tentar acessar as variações alterando o ID na URL de visualização:
`https://www.facebook.com/ads/library/?id=[AD_ID]`
Ao abrir o "Ver detalhes do resumo", você verá vários IDs. Clicar em cada um abrirá a versão específica daquele criativo.

## 3. Desvendando Anúncios de Catálogo (DPA)
Para anúncios vinculados a catálogos, a Ad Library muitas vezes mostra apenas um "produto exemplo".
- **Onde estão os outros?** Eles não estão "escondidos" por malícia, mas sim porque são gerados dinamicamente no momento da impressão.
- **Técnica de Inspeção:**
  1. Abra a Ad Library e localize o anúncio de catálogo.
  2. Use o **Inspecionar Elemento (F12)** -> Aba **Network (Rede)**.
  3. Filtre por `graphql`.
  4. Procure por requisições que contenham `AdLibrary` ou `Catalog`. Frequentemente, a resposta JSON contém a lista de `product_ids` ou URLs de imagens do catálogo que o anúncio está puxando.

## 4. Ferramentas de Terceiros (O que os profissionais usam)
Como o Facebook limita a visualização manual, o mercado de marketing digital usa ferramentas que "puxam" todas as variações via API privada ou scraping massivo:
- **AdSpy / BigSpy:** Possuem crawlers que capturam as variações no momento em que aparecem no feed de usuários reais.
- **Foreplay.co / Motion:** Ferramentas focadas em "ad inspiration" que salvam os criativos e suas variações dinâmicas para análise.
- **Apify Facebook Ad Library Scraper:** Permite extrair os campos `ad_creative_body` e `ad_snapshot_url` de todas as versões listadas no resumo.

## 5. Dica de "Ouro" dos Fóruns (Reddit/X)
Muitos media buyers recomendam olhar o **"Ad Library Report"** para ver quais páginas estão gastando mais com anúncios dinâmicos. Se um anúncio tem "100+ versões", é um sinal claro de que o anunciante está usando **Advantage+ Shopping Campaigns (ASC)**, onde o Facebook controla as variações. Para ver as variações de texto, às vezes elas aparecem listadas uma abaixo da outra na seção de detalhes, mas as variações de imagem de catálogo exigem clicar no carrossel (se disponível) ou usar o método de inspeção de rede.