# 🔍 Guia Completo: O Que Fazer Com Os IDs Extraídos

## Resumo Executivo

Os IDs que extraímos da página `claramendezpsicologa.com/den/` são **chaves mestras** para mapear toda a rede de fraude. Cada ID fornece acesso a diferentes camadas de informação sobre as campanhas de cloaking.

---

## 📊 Os 4 IDs Principais e Seu Potencial

### 1. **ConvertAI Account ID: `11f4afdf-b5f3-4009-96e1-41de610a7b79`**

#### O que é:
- Identificador único da conta ConvertAI (Vturb)
- Agrupa TODOS os vídeos de vendas (VSL) criados por este usuário
- Vinculado a um proprietário/criador específico

#### O que podemos fazer:
✅ **Encontrar TODOS os vídeos da mesma conta**
- Cada vídeo criado nesta conta terá este ID
- Padrão de URL: `https://scripts.converteai.net/11f4afdf-b5f3-4009-96e1-41de610a7b79/ab-test/{PLAYER_ID}/player.js`

✅ **Identificar padrões de cloaking**
- Quantos vídeos foram criados?
- Qual é a frequência de criação?
- Há padrões de nomes ou temas?

✅ **Mapear campanhas relacionadas**
- Todos os vídeos desta conta estão relacionados
- Podem estar usando diferentes domínios
- Podem estar direcionados a diferentes públicos

#### Como acessar:
```bash
# Procurar por padrões em URLs públicas
curl -s "https://scripts.converteai.net/11f4afdf-b5f3-4009-96e1-41de610a7b79/" 

# Tentar acessar via API (requer autenticação)
# https://api.vturb.com.br/v1/account/11f4afdf-b5f3-4009-96e1-41de610a7b79/videos
```

#### Limitações:
- ⚠️ Vturb protege a API com autenticação
- ⚠️ Não há endpoint público para listar vídeos de uma conta
- ✅ Porém: Podemos procurar por referências em sites públicos

---

### 2. **Player ID: `6987c05e27efa9d18cdb6dda`**

#### O que é:
- Identificador único do vídeo específico
- Cada vídeo tem seu próprio Player ID
- Contém todas as métricas daquele vídeo

#### O que podemos fazer:
✅ **Acessar métricas do vídeo**
- Número de visualizações
- Taxa de conversão
- Tempo médio de permanência
- Fonte de tráfego
- Dados demográficos

✅ **Rastrear performance**
- Quando o vídeo foi criado
- Quando recebeu mais visualizações
- Qual foi o pico de conversões

✅ **Identificar campanhas bem-sucedidas**
- Qual vídeo converteu melhor?
- Qual gerou mais receita?

#### Como acessar:
```bash
# Via Vturb Analytics API (requer API key)
curl -X GET "https://api.vturb.com.br/analytics/videos/6987c05e27efa9d18cdb6dda" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Parâmetros disponíveis:
# - date_from, date_to (período)
# - metrics: plays, views, retention, conversions
# - group_by: day, week, month, traffic_source
```

#### Métricas Disponíveis:
| Métrica | Descrição |
|---------|-----------|
| **Plays** | Quantas vezes o vídeo foi iniciado |
| **Views** | Quantas vezes foi visualizado completamente |
| **Retention** | Tempo médio de permanência |
| **Conversions** | Quantas conversões ocorreram |
| **Traffic Source** | De onde veio o tráfego (Facebook, Google, etc.) |
| **Audience** | Dados demográficos dos visualizadores |

#### Limitações:
- ⚠️ Requer API key do proprietário da conta
- ✅ Porém: Podemos tentar acessar sem autenticação para ver se há dados públicos

---

### 3. **Facebook Pixel ID: `1109903400516816`**

#### O que é:
- Identificador do pixel de rastreamento Facebook
- Vinculado a uma conta de anúncios específica
- Rastreia todas as conversões desta campanha

#### O que podemos fazer:
✅ **Encontrar TODAS as campanhas usando este pixel**
- Cada campanha que usa este pixel está relacionada
- Podem estar em diferentes domínios
- Podem estar em diferentes plataformas

✅ **Identificar padrões de gastos**
- Quanto foi gasto em campanhas?
- Qual é o ROI?
- Qual é o custo por conversão?

✅ **Descobrir públicos-alvo**
- Qual é o público-alvo das campanhas?
- Qual é a localização geográfica?
- Qual é a faixa etária?

✅ **Mapear toda a rede de fraude**
- Todos os domínios usando este pixel
- Todas as páginas de vendas
- Todos os produtos sendo promovidos

#### Como acessar:
```bash
# Via Meta Ad Library (público)
# Pesquisar por domínio: claramendezpsicologa.com
# https://facebook.com/ads/library/

# Via Meta Graph API (requer autenticação)
curl -X GET "https://graph.instagram.com/v18.0/ig_hashtag_search" \
  -d "user_id=17841400155521" \
  -d "fields=id,name" \
  -d "access_token=YOUR_TOKEN"

# Procurar por referências do pixel em sites
grep -r "1109903400516816" *.html
```

#### Ferramentas Disponíveis:
| Ferramenta | Acesso | Utilidade |
|-----------|--------|----------|
| **Meta Ad Library** | Público | Ver campanhas ativas |
| **Meta Ad Library API** | Autenticado | Acesso programático |
| **Pixel Finder Tools** | Público | Encontrar sites com o pixel |
| **Ad Spy Tools** | Pago | Análise detalhada de campanhas |

#### Limitações:
- ⚠️ Meta protege dados de campanhas
- ✅ Porém: Ad Library é público para campanhas ativas
- ✅ Podemos usar ferramentas de terceiros para análise

---

### 4. **WordPress Page ID: `66`**

#### O que é:
- Identificador da página no banco de dados WordPress
- Cada página tem um ID único
- Pode ser acessado via REST API

#### O que podemos fazer:
✅ **Acessar informações da página**
- Autor/proprietário
- Data de criação e modificação
- Histórico de edições
- Conteúdo completo

✅ **Encontrar outras páginas do mesmo site**
- Quantas páginas existem?
- Qual é a estrutura do site?
- Há outras páginas de cloaking?

✅ **Rastrear modificações**
- Quando a página foi criada?
- Quantas vezes foi modificada?
- Quem fez as modificações?

#### Como acessar:
```bash
# Via WordPress REST API (público)
curl -s "https://claramendezpsicologa.com/wp-json/wp/v2/pages/66" | jq '.'

# Resposta típica inclui:
# - id, title, content, author, date, modified
# - _links (links relacionados)
# - meta (metadados customizados)

# Listar TODAS as páginas do site
curl -s "https://claramendezpsicologa.com/wp-json/wp/v2/pages?per_page=100" | jq '.[] | {id, title, slug}'

# Acessar histórico de revisões
curl -s "https://claramendezpsicologa.com/wp-json/wp/v2/pages/66/revisions" | jq '.'
```

#### Informações Disponíveis:
| Campo | Descrição |
|-------|-----------|
| **ID** | 66 |
| **Title** | Título da página |
| **Content** | Conteúdo HTML completo |
| **Author** | ID do autor (pode levar a outras páginas) |
| **Date** | Data de criação |
| **Modified** | Data da última modificação |
| **Slug** | URL amigável |
| **Status** | publish, draft, etc. |

#### Limitações:
- ✅ WordPress REST API é geralmente público
- ✅ Não requer autenticação
- ⚠️ Alguns sites desabilitam a API

---

## 🎯 Estratégia de Investigação Completa

### Fase 1: Reconhecimento (O que já temos)
```
✅ ConvertAI Account: 11f4afdf-b5f3-4009-96e1-41de610a7b79
✅ Player ID: 6987c05e27efa9d18cdb6dda
✅ Facebook Pixel: 1109903400516816
✅ WordPress Page: 66
✅ Domínio: claramendezpsicologa.com
```

### Fase 2: Expansão (Encontrar mais vítimas)
```
1. Procurar por referências do ConvertAI Account ID em:
   - Google: "11f4afdf-b5f3-4009-96e1-41de610a7b79"
   - GitHub: Código exposto
   - Wayback Machine: Histórico de sites
   - Pastebin: Configurações vazadas

2. Procurar por referências do Facebook Pixel em:
   - Meta Ad Library (claramendezpsicologa.com)
   - Pixel Finder Tools
   - Ad Spy Tools (AdPlexity, Anstrex, etc.)

3. Procurar por referências do WordPress Page ID em:
   - Backlinks (apontando para /den/)
   - Referrer logs
   - Analytics
```

### Fase 3: Análise (Entender a rede)
```
1. Mapear todos os domínios usando o mesmo pixel
2. Identificar padrões de conteúdo
3. Encontrar proprietários comuns
4. Rastrear fluxo de dinheiro
5. Identificar produtos sendo vendidos
```

### Fase 4: Documentação (Compilar evidências)
```
1. Criar mapa visual da rede
2. Documentar todas as campanhas
3. Calcular receita total
4. Identificar vítimas
5. Preparar relatório para Meta/Hotmart
```

---

## 🛠️ Ferramentas Recomendadas

### Ferramentas Gratuitas
| Ferramenta | Uso | URL |
|-----------|-----|-----|
| **Meta Ad Library** | Encontrar campanhas | facebook.com/ads/library |
| **Wayback Machine** | Histórico de sites | archive.org |
| **Google Search** | Encontrar referências | google.com |
| **WHOIS** | Informações de domínio | whois.com |
| **Reverse IP** | Encontrar sites no mesmo servidor | bing.com |
| **WordPress REST API** | Dados de página | /wp-json/wp/v2/pages |

### Ferramentas Pagas (Recomendadas)
| Ferramenta | Uso | Preço |
|-----------|-----|-------|
| **AdPlexity** | Análise de campanhas | $99-299/mês |
| **Anstrex** | Spy de anúncios | $79-299/mês |
| **Semrush** | Análise de tráfego | $120-450/mês |
| **Similarweb** | Dados de tráfego | $99-999/mês |

---

## 📋 Checklist de Investigação

### Investigação do ConvertAI Account
- [ ] Procurar por "11f4afdf-b5f3-4009-96e1-41de610a7b79" no Google
- [ ] Procurar no Wayback Machine
- [ ] Procurar em repositórios GitHub
- [ ] Procurar em Pastebin
- [ ] Listar todos os Player IDs encontrados
- [ ] Documentar cada vídeo

### Investigação do Facebook Pixel
- [ ] Pesquisar no Meta Ad Library
- [ ] Usar Ad Spy Tools
- [ ] Encontrar todos os domínios
- [ ] Documentar campanhas ativas
- [ ] Calcular gastos totais
- [ ] Identificar públicos-alvo

### Investigação do WordPress
- [ ] Acessar REST API da página 66
- [ ] Listar todas as páginas do site
- [ ] Verificar histórico de revisões
- [ ] Identificar autor
- [ ] Procurar por outras páginas de cloaking
- [ ] Documentar estrutura do site

### Investigação do Domínio
- [ ] Verificar WHOIS
- [ ] Procurar por histórico DNS
- [ ] Encontrar IP do servidor
- [ ] Procurar por outros domínios no mesmo IP
- [ ] Verificar certificado SSL
- [ ] Analisar backlinks

---

## 🚀 Próximos Passos Recomendados

### Curto Prazo (Hoje)
1. ✅ Acessar Meta Ad Library para claramendezpsicologa.com
2. ✅ Acessar WordPress REST API para listar páginas
3. ✅ Procurar no Google pelos IDs
4. ✅ Verificar Wayback Machine

### Médio Prazo (Esta Semana)
1. ✅ Usar Ad Spy Tools para análise detalhada
2. ✅ Mapear toda a rede de domínios
3. ✅ Documentar campanhas ativas
4. ✅ Calcular receita total

### Longo Prazo (Este Mês)
1. ✅ Compilar relatório completo
2. ✅ Reportar ao Meta
3. ✅ Reportar ao Hotmart
4. ✅ Compartilhar com comunidade de segurança

---

## 📊 Exemplo de Mapa de Rede

```
┌─────────────────────────────────────────────────────────────┐
│ ConvertAI Account: 11f4afdf-b5f3-4009-96e1-41de610a7b79   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ├─ Player 1: 6987c05e27efa9d18cdb6dda                      │
│ │  └─ Domain: claramendezpsicologa.com/den/               │
│ │  └─ Pixel: 1109903400516816                             │
│ │  └─ Product: Curso de Psicologia (Hotmart)             │
│ │  └─ Views: ???                                          │
│ │  └─ Conversions: ???                                    │
│ │                                                          │
│ ├─ Player 2: [DESCONHECIDO]                               │
│ │  └─ Domain: [DESCONHECIDO]                              │
│ │  └─ Pixel: [DESCONHECIDO OU MESMO]                      │
│ │  └─ Product: [DESCONHECIDO]                             │
│ │                                                          │
│ └─ Player N: [DESCONHECIDO]                               │
│    └─ ...                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Considerações Éticas e Legais

### ✅ Permitido
- Pesquisar em dados públicos
- Usar Meta Ad Library
- Acessar WordPress REST API pública
- Usar ferramentas de análise legítimas
- Reportar fraude aos órgãos competentes

### ❌ Não Permitido
- Acessar APIs sem autorização
- Fazer força bruta em senhas
- Invadir sistemas
- Usar dados para fins maliciosos
- Compartilhar dados pessoais

### ⚖️ Recomendações
- Documentar tudo para fins educacionais/acadêmicos
- Reportar descobertas aos órgãos competentes
- Não compartilhar dados pessoais
- Respeitar privacidade dos envolvidos
- Seguir legislação local (LGPD, GDPR, etc.)

---

## 📞 Órgãos para Reportar

| Órgão | Tipo de Fraude | Contato |
|-------|----------------|---------|
| **Meta** | Cloaking em Facebook Ads | facebook.com/help |
| **Hotmart** | Fraude em produtos | suporte.hotmart.com |
| **CONAR** | Publicidade enganosa | conar.org.br |
| **Polícia Federal** | Fraude online | pf.gov.br |
| **Procon** | Proteção ao consumidor | procon.sp.gov.br |

---

**Conclusão:** Com esses 4 IDs, você tem as chaves para mapear toda a rede de fraude. O próximo passo é usar as ferramentas e técnicas descritas acima para expandir a investigação e descobrir todos os domínios, campanhas e vítimas envolvidas.
