# 🔍 Pesquisa: Ferramentas Anti-Cloaking no GitHub

## Objetivo
Encontrar ferramentas open-source que simulem um usuário real do Facebook para conseguir ver a "money page" que o The White Rabbit (TWR) esconde.

---

## 🏆 Repositórios Encontrados no GitHub

### 1. `UWCSESecurityLab/adscraper` ⭐ MAIS RELEVANTE
- **Link:** https://github.com/UWCSESecurityLab/adscraper
- **O que faz:** Crawler de anúncios online feito com Puppeteer. Visita URLs em um Chromium e coleta:
  - Screenshots dos anúncios
  - URLs dos anúncios
  - **Landing pages dos anúncios** (isso é o que precisamos!)
  - Requests de tracking de terceiros
- **Tecnologia:** Node.js + Puppeteer
- **Uso:** Ferramenta de pesquisa acadêmica (Universidade de Washington)
- **Licença:** MIT (livre para usar)
- **Por que é útil:** Já faz exatamente o que precisamos — segue a cadeia de redirecionamentos dos anúncios e captura a página final.

---

### 2. `ZFC-Digital/puppeteer-real-browser` ⭐ ESSENCIAL
- **Link:** https://github.com/ZFC-Digital/puppeteer-real-browser
- **O que faz:** Faz o Puppeteer parecer um **navegador real**, passando por verificações anti-bot como Cloudflare.
- **Recursos:**
  - Bypass de CAPTCHA
  - Fingerprint realista (canvas, WebGL, etc.)
  - Movimentos de mouse humanos
  - Resolve o problema do `navigator.webdriver`
- **Por que é útil:** O TWR detecta bots pela fingerprint do navegador. Essa ferramenta esconde que é automação.

---

### 3. `rebrowser/rebrowser-puppeteer`
- **Link:** https://github.com/rebrowser/rebrowser-puppeteer
- **O que faz:** Substituto direto do Puppeteer normal, mas já vem "patcheado" para **passar nos testes de detecção de automação**.
- **Vantagem:** Drop-in replacement — basta trocar o `require('puppeteer')` por `require('rebrowser-puppeteer')`.
- **Por que é útil:** Alternativa ao puppeteer-real-browser, mais simples de integrar.

---

### 4. `dvygolov/YellowCloaker` (engenharia reversa)
- **Link:** https://github.com/dvygolov/YellowCloaker
- **O que faz:** Cloaker **gratuito** e open-source em PHP. Embora seja uma ferramenta DE cloaking (não anti-cloaking), é extremamente útil para:
  - **Entender como cloakers funcionam por dentro**
  - Estudar os filtros (OS, IP, User-Agent, Device Type)
  - Ver como white pages e black pages são configuradas
- **Filtros que ele usa:** OS, IP, dispositivo, user-agent, referrer
- **Por que é útil:** Engenharia reversa — entendendo como ele filtra, sabemos exatamente o que simular para passar.

---

### 5. `KMG-Official/free-cloak-system-client`
- **Link:** https://github.com/KMG-Official/free-cloak-system-client
- **O que faz:** Sistema de cloaking em PHP com:
  - Reconhecimento de fingerprint
  - Base de dados de IPs blacklistados
  - Interceptação de crawlers
  - Proteção de landing pages (Money Pages)
- **Plataformas suportadas:** Facebook, Google, TikTok
- **Por que é útil:** Mais uma fonte para entender a lógica de filtragem que precisamos burlar.

---

### 6. `paulpierre/pp_adsensor`
- **Link:** https://github.com/paulpierre/pp_adsensor
- **O que faz:** Ferramenta anti-fraude e anti-cloaking, usada em DSP ad creatives para avaliar impressões e natureza do usuário.
- **Status:** Não mais mantida ativamente, mas o código fonte é referência.

---

### 7. `Takk8IS/search-seo-cloaking-affiliate`
- **Link:** https://github.com/Takk8IS/search-seo-cloaking-affiliate
- **O que faz:** Ferramenta para analisar SEO, cloaking e dados de affiliate marketing de uma URL.

---

## 🧪 Técnica Completa para Bypassing TWR

Baseado na pesquisa, aqui está a **receita** para simular um usuário real do Facebook e ver a money page:

### Ingredientes Necessários

| Componente | Ferramenta | Propósito |
|------------|-----------|-----------|
| **Browser Stealth** | `puppeteer-real-browser` ou `rebrowser-puppeteer` | Parecer navegador real |
| **Stealth Plugin** | `puppeteer-extra-plugin-stealth` | Esconder sinais de automação |
| **Proxy Residencial** | Serviço pago (BrightData, SmartProxy, etc.) | IP de pessoa real, não datacenter |
| **Referrer Spoofing** | `page.setExtraHTTPHeaders()` | Fingir que veio do Facebook |
| **User-Agent Real** | UA de dispositivo real | Fingir ser celular/desktop real |
| **Redirect Chain** | `response.request().redirectChain()` | Rastrear todos os redirecionamentos |

### Fluxo de Execução

```
1. PREPARAÇÃO
   ├─ Iniciar puppeteer-real-browser (ou rebrowser-puppeteer)
   ├─ Ativar puppeteer-extra-plugin-stealth
   ├─ Configurar proxy residencial (IP brasileiro, se necessário)
   └─ Definir User-Agent de dispositivo móvel real

2. SIMULAÇÃO DO CLIQUE DO FACEBOOK
   ├─ Definir Referer: "https://www.facebook.com/"
   ├─ Definir Accept-Language para pt-BR
   ├─ Navegar para a URL do anúncio
   └─ Esperar carregamento completo (networkidle0)

3. CAPTURA
   ├─ Capturar redirect chain completa
   ├─ Capturar URL final (page.url())
   ├─ Tirar screenshot da página final
   ├─ Capturar o HTML completo
   └─ Salvar todos os dados

4. ANÁLISE
   ├─ Comparar URL final com URL original
   ├─ Verificar se há parâmetros twrclid/tok
   ├─ Identificar se é white page ou money page
   └─ Documentar os resultados
```

### Código Conceitual (Pseudo-código)

```javascript
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// OU usar puppeteer-real-browser:
// const { connect } = require('puppeteer-real-browser');

async function revealMoneyPage(adUrl) {
  const browser = await puppeteer.launch({
    headless: false, // modo visual para parecer mais real
    args: [
      '--proxy-server=RESIDENTIAL_PROXY_HERE',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // 1. Simular dispositivo mobile real
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  );

  // 2. Fingir que veio do Facebook
  await page.setExtraHTTPHeaders({
    'Referer': 'https://www.facebook.com/',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  });

  // 3. Rastrear todos os redirecionamentos
  const redirects = [];
  page.on('response', (res) => {
    const chain = res.request().redirectChain();
    chain.forEach(req => redirects.push(req.url()));
  });

  // 4. Navegar para a URL do anúncio
  await page.goto(adUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // 5. Capturar resultado
  const finalUrl = page.url();
  await page.screenshot({ path: 'money_page.png', fullPage: true });
  const html = await page.content();

  console.log('URL Final:', finalUrl);
  console.log('Redirects:', redirects);
  console.log('É money page?', !finalUrl.includes('blog') && !finalUrl.includes('safe'));

  await browser.close();
  return { finalUrl, redirects, html };
}
```

---

## ⚠️ Requisitos Críticos para Bypass do TWR

### O que o TWR verifica (baseado no YellowCloaker e free-cloak-system):

1. **IP do visitante** → Precisa ser IP residencial (não VPN/datacenter)
2. **User-Agent** → Precisa ser de dispositivo real (não headless)
3. **Referrer** → Precisa vir de `facebook.com` ou `instagram.com`
4. **Fingerprint do navegador** → Canvas, WebGL, plugins devem ser realistas
5. **navigator.webdriver** → Não pode ser `true` (sinal de automação)
6. **Behavioral patterns** → Movimentos de mouse, tempo na página

### O que NÃO funciona:
- ❌ curl/wget simples (detectado como bot)
- ❌ Puppeteer padrão sem stealth (navigator.webdriver = true)
- ❌ VPN ou proxy de datacenter (IP blacklistado)
- ❌ Acessar URL diretamente sem referrer

---

## 📚 Referências

- https://github.com/UWCSESecurityLab/adscraper
- https://github.com/ZFC-Digital/puppeteer-real-browser
- https://github.com/rebrowser/rebrowser-puppeteer
- https://github.com/dvygolov/YellowCloaker
- https://github.com/KMG-Official/free-cloak-system-client
- https://github.com/paulpierre/pp_adsensor
- https://github.com/Takk8IS/search-seo-cloaking-affiliate
- https://www.npmjs.com/package/puppeteer-extra-plugin-stealth

---

**Pesquisa Concluída:** 2026-02-13
**Confiança:** Alta
**Status:** Técnicas e ferramentas identificadas com sucesso
