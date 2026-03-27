# Guia Técnico: Extração de Criativos da Biblioteca de Anúncios do Facebook

## 1. Acesso à API Oficial (Ads Archive API)
Para anúncios comerciais gerais, a API oficial é restrita a anúncios que atingiram a União Europeia (UE) ou que são de temas sociais/políticos. Se o seu alvo for anúncios comerciais fora da UE, a API oficial **não retornará resultados**.

### Requisitos de Configuração:
1. **Identidade Verificada:** Necessário confirmar identidade em `facebook.com/ID`.
2. **App no Meta for Developers:** Criar um aplicativo e obter um `Access Token`.
3. **Endpoint:** `GET graph.facebook.com/v24.0/ads_archive`

### Campos Relevantes para Criativos:
| Campo | Descrição |
| :--- | :--- |
| `ad_snapshot_url` | URL para a página de visualização do anúncio. É a chave para ver o criativo original. |
| `ad_creative_body` | O texto principal do anúncio. |
| `ad_creative_link_caption` | Legenda do link no anúncio. |
| `ad_creative_link_title` | Título do link no anúncio. |
| `media_type` | Tipo de mídia (IMAGE, VIDEO, MEME). |

**Nota:** A API oficial **não fornece diretamente** o link direto para o arquivo `.jpg` ou `.mp4`. Ela fornece a `ad_snapshot_url`, que contém o player de vídeo ou a imagem renderizada.

---

## 2. Métodos de Extração de Mídia (Imagens/Vídeos)
Como a API não entrega o arquivo direto, existem duas abordagens principais:

### Abordagem A: Scraping da Snapshot URL (Oficial + Script)
1. Use a API para obter a lista de `ad_snapshot_url`.
2. Use um script (Python + Selenium/Playwright) para abrir cada URL.
3. Extraia as tags `<img src="...">` ou `<video src="...">` da página da snapshot.

### Abordagem B: APIs de Terceiros (Scrapers Prontos)
Existem serviços que já fazem o "bypass" das restrições e entregam o JSON com links diretos de mídia:
- **Apify (Facebook Ad Library Scraper):** Um dos mais populares. Consegue extrair vídeos e imagens em alta resolução.
- **ScrapeCreators:** Oferece uma API não oficial focada em Ad Library.
- **AdSpy/BigSpy:** Ferramentas de inteligência competitiva que possuem suas próprias bases de dados e APIs pagas.

---

## 3. Exemplo de Requisição (Python)
```python
import requests

token = 'SEU_ACCESS_TOKEN'
params = {
    'access_token': token,
    'ad_type': 'ALL',
    'ad_reached_countries': "['BR']",
    'search_terms': 'sua palavra chave',
    'fields': 'id,ad_snapshot_url,ad_creative_body,page_name'
}

response = requests.get('https://graph.facebook.com/v24.0/ads_archive', params=params)
data = response.json()

for ad in data.get('data', []):
    print(f"Página: {ad['page_name']}")
    print(f"Snapshot: {ad['ad_snapshot_url']}")
```
