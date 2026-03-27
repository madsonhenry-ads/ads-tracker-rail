# Pesquisa: API da Biblioteca de Anúncios do Facebook

## API Oficial (Ads Archive API)
- **Endpoint:** `https://graph.facebook.com/<VERSION>/ads_archive`
- **Requisitos de Acesso:**
  - Conta de desenvolvedor do Facebook.
  - Identidade verificada (necessário para anúncios de temas sociais, eleições ou política).
  - Um aplicativo do Facebook configurado.
- **Limitações Cruciais:**
  - A API é primariamente voltada para anúncios sobre **temas sociais, eleições ou política**.
  - No entanto, o parâmetro `ad_type` aceita `ALL`, `EMPLOYMENT_ADS`, `HOUSING_ADS`, etc.
  - **Importante:** Ads que não atingiram a União Europeia (UE) só retornam se forem de temas sociais/políticos.
  - Para anúncios comerciais gerais (não políticos) fora da UE, a API oficial é extremamente limitada ou restrita.
- **Campos de Criativos:**
  - `ad_snapshot_url`: URL para visualizar o anúncio na Biblioteca de Anúncios.
  - `ad_creative_body`, `ad_creative_link_caption`, `ad_creative_link_description`, `ad_creative_link_title`.
  - `page_id`, `page_name`.

## Alternativas de Raspagem (Scraping)
- Como a API oficial é restrita para anúncios comerciais comuns, muitos usuários recorrem a:
  1. **APIs de Terceiros (Unofficial APIs):** Ex: ScrapeCreators, Apify, etc.
  2. **Automação de Navegador (Puppeteer/Playwright):** Simular navegação na Ad Library pública.
  3. **Marketing API:** Para anúncios da própria conta, mas não para "espionar" concorrentes.
