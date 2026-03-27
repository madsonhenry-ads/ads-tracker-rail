# 📊 Facebook Ads Tracker Dashboard

> Sistema completo de monitoramento e análise de anúncios ativos na Facebook Ads Library com dashboard interativo, coleta automatizada e análise de tendências.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Modelo de Dados](#-modelo-de-dados)
- [API Endpoints](#-api-endpoints)
- [Sistema de Scraping](#-sistema-de-scraping)
- [Dashboard Interface](#-dashboard-interface)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)

---

## 🎯 Visão Geral

O **Facebook Ads Tracker Dashboard** é uma plataforma completa para monitorar e analisar a atividade publicitária de páginas no Facebook. O sistema coleta automaticamente dados da Facebook Ads Library, armazena histórico temporal e apresenta análises visuais através de um dashboard interativo.

### Casos de Uso

- **Marketing Agencies**: Monitorar concorrentes e benchmarking de campanhas
- **E-commerce**: Análise de estratégias de publicidade de competidores
- **Pesquisa de Mercado**: Identificar tendências em diferentes nichos
- **Consultoria**: Gerar relatórios de análise competitiva para clientes

### Problema Resolvido

Atualmente, a Facebook Ads Library não oferece:
- ✗ Histórico de variações temporais
- ✗ Comparação entre múltiplas páginas
- ✗ Alertas automáticos de mudanças
- ✗ Análise de tendências visuais
- ✗ Exportação de dados para análise

**Nossa solução oferece tudo isso em uma única plataforma.**

---

## ✨ Funcionalidades

### Core Features (MVP)

- [x] **Monitoramento de Páginas**
  - Adicionar páginas via URL da Ads Library
  - Categorização com tags personalizadas
  - Filtros por país, idioma e categoria

- [x] **Coleta Automatizada**
  - Scraping agendado (diário/horário configurável)
  - Detecção automática de mudanças
  - Retry logic com exponential backoff
  - Logs detalhados de execução

- [x] **Dashboard Interativo**
  - Cards com métricas em tempo real
  - Variações diárias e semanais
  - Gráficos de tendências temporais
  - Comparação entre períodos

- [x] **Análise de Dados**
  - Cálculo automático de variações percentuais
  - Identificação de picos e quedas
  - Média móvel de 7/30 dias
  - Detecção de anomalias

### Advanced Features (Roadmap)

- [ ] **Alertas Inteligentes**
  - Notificações via email/Slack/Discord
  - Triggers customizáveis (ex: queda >20%)
  - Digest diário/semanal

- [ ] **Análise Competitiva**
  - Comparação lado a lado de múltiplas páginas
  - Benchmarking de mercado
  - Share of voice publicitário

- [ ] **Relatórios Automatizados**
  - Exportação CSV/Excel/PDF
  - Templates personalizáveis
  - Agendamento de envio

- [ ] **AI Insights**
  - Detecção de padrões sazonais
  - Previsão de tendências
  - Recomendações estratégicas

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Web Dashboard │  │  Mobile View   │  │   API Client   │    │
│  │   (React SPA)  │  │  (Responsive)  │  │   (Optional)   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Server (Express)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │  Pages   │  │ Snapshots│  │ Analytics│  │  Auth   │  │  │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │ Routes  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Business Logic & Services                    │  │
│  │  • PageService  • MetricsCalculator  • AlertManager      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      BACKGROUND JOBS LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Scheduler (node-cron/Bull)                  │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │  │
│  │  │ Daily Scraper  │  │ Metrics Calc   │  │   Alerts   │ │  │
│  │  │   (Puppeteer)  │  │  (Aggregator)  │  │  Sender    │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL     │  │   Redis Cache    │  │  File Storage│ │
│  │  (Primary DB)    │  │  (Sessions/Cache)│  │   (Exports)  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Coleta**: Scraper → Facebook Ads Library → Raw Data
2. **Processamento**: Raw Data → Validation → Database Storage
3. **Análise**: Database → Metrics Calculator → Aggregated Data
4. **Visualização**: API → Frontend → User Dashboard

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.x | UI Framework |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 3.x | Styling Framework |
| **Recharts** | 2.x | Data Visualization |
| **Tanstack Query** | 5.x | Server State Management |
| **Zustand** | 4.x | Client State Management |
| **React Router** | 6.x | Routing |
| **date-fns** | 3.x | Date Manipulation |
| **Axios** | 1.x | HTTP Client |

### Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 18+ LTS | Runtime |
| **Express** | 4.x | Web Framework |
| **TypeScript** | 5.x | Type Safety |
| **Prisma** | 5.x | ORM |
| **PostgreSQL** | 15.x | Primary Database |
| **Redis** | 7.x | Cache & Sessions |
| **Puppeteer** | 21.x | Web Scraping |
| **node-cron** | 3.x | Job Scheduling |
| **Winston** | 3.x | Logging |
| **Joi** | 17.x | Validation |

### DevOps & Tools

| Tecnologia | Propósito |
|------------|-----------|
| **Docker** | Containerization |
| **Docker Compose** | Local Development |
| **GitHub Actions** | CI/CD Pipeline |
| **ESLint + Prettier** | Code Quality |
| **Jest** | Testing Framework |
| **Supertest** | API Testing |

---

## 📁 Estrutura do Projeto

```
facebook-ads-tracker/
├── 📂 frontend/                    # React Application
│   ├── 📂 public/
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── 📂 src/
│   │   ├── 📂 components/          # React Components
│   │   │   ├── 📂 common/          # Reusable Components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── 📂 dashboard/       # Dashboard Specific
│   │   │   │   ├── PageCard.tsx
│   │   │   │   ├── MetricsChart.tsx
│   │   │   │   ├── StatsOverview.tsx
│   │   │   │   └── FilterBar.tsx
│   │   │   └── 📂 layout/          # Layout Components
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Footer.tsx
│   │   ├── 📂 pages/               # Page Components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PageDetails.tsx
│   │   │   ├── AddPage.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── 📂 hooks/               # Custom Hooks
│   │   │   ├── usePages.ts
│   │   │   ├── useMetrics.ts
│   │   │   └── useFilters.ts
│   │   ├── 📂 services/            # API Services
│   │   │   ├── api.ts
│   │   │   ├── pagesService.ts
│   │   │   └── metricsService.ts
│   │   ├── 📂 store/               # State Management
│   │   │   ├── pagesStore.ts
│   │   │   └── uiStore.ts
│   │   ├── 📂 types/               # TypeScript Types
│   │   │   ├── page.types.ts
│   │   │   ├── metrics.types.ts
│   │   │   └── api.types.ts
│   │   ├── 📂 utils/               # Utility Functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── 📂 backend/                     # Node.js API
│   ├── 📂 src/
│   │   ├── 📂 config/              # Configuration
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── scraper.ts
│   │   ├── 📂 controllers/         # Route Controllers
│   │   │   ├── pagesController.ts
│   │   │   ├── snapshotsController.ts
│   │   │   └── metricsController.ts
│   │   ├── 📂 services/            # Business Logic
│   │   │   ├── pageService.ts
│   │   │   ├── scraperService.ts
│   │   │   ├── metricsService.ts
│   │   │   └── alertService.ts
│   │   ├── 📂 models/              # Prisma Models
│   │   │   └── schema.prisma
│   │   ├── 📂 routes/              # API Routes
│   │   │   ├── index.ts
│   │   │   ├── pages.routes.ts
│   │   │   ├── snapshots.routes.ts
│   │   │   └── metrics.routes.ts
│   │   ├── 📂 middlewares/         # Express Middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── 📂 jobs/                # Background Jobs
│   │   │   ├── schedulers/
│   │   │   │   └── cronJobs.ts
│   │   │   ├── scrapers/
│   │   │   │   ├── facebookScraper.ts
│   │   │   │   └── scraperQueue.ts
│   │   │   └── processors/
│   │   │       ├── metricsProcessor.ts
│   │   │       └── alertProcessor.ts
│   │   ├── 📂 utils/               # Utility Functions
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   ├── helpers.ts
│   │   │   └── errors.ts
│   │   ├── 📂 types/               # TypeScript Types
│   │   │   ├── express.d.ts
│   │   │   └── custom.types.ts
│   │   ├── app.ts                  # Express App Setup
│   │   └── server.ts               # Server Entry Point
│   ├── 📂 tests/                   # Tests
│   │   ├── 📂 unit/
│   │   ├── 📂 integration/
│   │   └── setup.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── 📂 scraper/                     # Standalone Scraper (Optional)
│   ├── 📂 src/
│   │   ├── browser.ts
│   │   ├── parser.ts
│   │   └── index.ts
│   └── package.json
│
├── 📂 docker/                      # Docker Configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── https://github.com/madsonhenry-ads/ads-tracker-rail.git
│
├── 📂 docs/                        # Documentation
│   ├── API.md
│   ├── SCRAPING.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── .env.example                    # Environment Variables Template
├── .gitignore
├── README.md
└── package.json                    # Root Package (Monorepo)
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 15.0
- **Redis** >= 7.0
- **Docker** (opcional, mas recomendado)
- **npm** ou **yarn**

### Opção 1: Instalação com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/facebook-ads-tracker.git
cd facebook-ads-tracker

# Copie o arquivo de ambiente
cp .env.example .env

# Configure as variáveis de ambiente no .env
# (veja seção "Variáveis de Ambiente" abaixo)

# Inicie todos os serviços
docker-compose up -d

# Execute as migrations do banco de dados
docker-compose exec backend npx prisma migrate deploy

# Seed inicial (opcional)
docker-compose exec backend npm run seed

# Acesse a aplicação
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Adminer (DB GUI): http://localhost:8080
```

### Opção 2: Instalação Manual

#### 1. Backend Setup

```bash
cd backend

# Instale as dependências
npm install

# Configure o arquivo .env
cp .env.example .env

# Execute as migrations
npx prisma migrate dev

# Gere o Prisma Client
npx prisma generate

# Inicie o servidor de desenvolvimento
npm run dev

# Servidor rodando em http://localhost:5000
```

#### 2. Frontend Setup

```bash
cd frontend

# Instale as dependências
npm install

# Configure o arquivo .env
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm start

# Aplicação rodando em http://localhost:3000
```

#### 3. Banco de Dados Setup

```bash
# Crie o banco de dados PostgreSQL
createdb facebook_ads_tracker

# Ou usando psql
psql -U postgres
CREATE DATABASE facebook_ads_tracker;
\q
```

#### 4. Redis Setup

```bash
# Inicie o Redis
redis-server

# Ou com Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Variáveis de Ambiente

#### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/facebook_ads_tracker

# Redis
REDIS_URL=redis://localhost:6379

# Scraper Configuration
SCRAPER_HEADLESS=true
SCRAPER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
SCRAPER_VIEWPORT_WIDTH=1920
SCRAPER_VIEWPORT_HEIGHT=1080
SCRAPER_TIMEOUT=30000
SCRAPER_MAX_RETRIES=3
SCRAPER_RETRY_DELAY=5000

# Cron Jobs
CRON_DAILY_SCRAPE=0 6 * * *  # 6 AM todos os dias
CRON_METRICS_CALC=0 7 * * *  # 7 AM todos os dias

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# Email (para alertas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@adsTracker.com

# Alerts
ALERT_ENABLED=true
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_ANALYTICS=false
```

---

## 💾 Modelo de Dados

### Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE MODELS
// ============================================

model Page {
  id              String    @id @default(uuid())
  name            String    // Nome da página
  facebookPageId  String    @unique // ID da página no Facebook
  url             String    // URL da Ads Library
  description     String?   // Descrição opcional
  
  // Metadata
  country         String?   // País principal
  language        String?   // Idioma principal
  category        String?   // Categoria do negócio
  tags            String[]  // Tags customizadas (ex: ["lowticket", "latam"])
  
  // Status
  active          Boolean   @default(true)
  lastScrapedAt   DateTime? // Última coleta bem-sucedida
  scrapingEnabled Boolean   @default(true)
  
  // Configurações de Scraping
  scrapePeriod    String    @default("8d") // 1d, 8d, 30d, etc
  scrapeFrequency String    @default("daily") // hourly, daily, weekly
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  snapshots       AdSnapshot[]
  metrics         Metric[]
  alerts          Alert[]
  
  @@index([facebookPageId])
  @@index([active])
  @@map("pages")
}

model AdSnapshot {
  id              String    @id @default(uuid())
  pageId          String
  
  // Data coletada
  totalAds        Int       // Total de anúncios ativos
  timestamp       DateTime  @default(now()) // Momento exato da coleta
  date            DateTime  // Data (truncada para comparações)
  
  // Metadata da coleta
  collectionPeriod String   @default("8d") // Período usado na coleta
  scrapeDuration  Int?      // Duração em ms
  success         Boolean   @default(true)
  errorMessage    String?
  
  // Raw data (opcional, para debug)
  rawData         Json?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  
  // Relations
  page            Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  @@unique([pageId, date]) // Um snapshot por página por dia
  @@index([pageId, date])
  @@index([timestamp])
  @@map("ad_snapshots")
}

model Metric {
  id                    String    @id @default(uuid())
  pageId                String
  date                  DateTime  // Data de referência
  
  // Métricas principais
  totalAds              Int       // Total de anúncios neste dia
  
  // Variações
  dailyChange           Int?      // Diferença vs dia anterior
  weeklyChange          Int?      // Diferença vs 7 dias atrás
  monthlyChange         Int?      // Diferença vs 30 dias atrás
  
  // Percentuais
  dailyChangePercent    Float?
  weeklyChangePercent   Float?
  monthlyChangePercent  Float?
  
  // Médias móveis
  movingAvg7d           Float?    // Média móvel de 7 dias
  movingAvg30d          Float?    // Média móvel de 30 dias
  
  // Estatísticas
  maxAdsLast7d          Int?      // Máximo nos últimos 7 dias
  minAdsLast7d          Int?      // Mínimo nos últimos 7 dias
  avgAdsLast7d          Float?    // Média nos últimos 7 dias
  
  // Trends
  trend                 String?   // "up", "down", "stable"
  anomalyDetected       Boolean   @default(false)
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  page                  Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  @@unique([pageId, date])
  @@index([pageId, date])
  @@map("metrics")
}

// ============================================
// ALERTING SYSTEM
// ============================================

model Alert {
  id              String    @id @default(uuid())
  pageId          String
  
  // Configuração do alerta
  name            String    // Nome do alerta
  type            String    // "threshold", "percentage_change", "anomaly"
  condition       String    // "greater_than", "less_than", "equals"
  threshold       Float     // Valor de referência
  enabled         Boolean   @default(true)
  
  // Notificações
  channels        String[]  // ["email", "slack", "webhook"]
  recipients      String[]  // Emails ou IDs dos destinatários
  
  // Estado
  lastTriggered   DateTime?
  triggeredCount  Int       @default(0)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  page            Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  notifications   Notification[]
  
  @@index([pageId])
  @@index([enabled])
  @@map("alerts")
}

model Notification {
  id              String    @id @default(uuid())
  alertId         String
  
  // Detalhes da notificação
  channel         String    // "email", "slack", "webhook"
  recipient       String
  subject         String?
  message         String
  
  // Metadata
  triggeredValue  Float     // Valor que disparou o alerta
  threshold       Float     // Threshold do alerta
  
  // Status
  sent            Boolean   @default(false)
  sentAt          DateTime?
  error           String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  
  // Relations
  alert           Alert     @relation(fields: [alertId], references: [id], onDelete: Cascade)
  
  @@index([alertId])
  @@index([sent])
  @@map("notifications")
}

// ============================================
// SYSTEM & LOGGING
// ============================================

model ScrapingLog {
  id              String    @id @default(uuid())
  pageId          String?   // Null = scraping geral
  
  // Execução
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  duration        Int?      // Milissegundos
  
  // Status
  status          String    // "running", "completed", "failed"
  pagesScraped    Int       @default(0)
  pagesSuccess    Int       @default(0)
  pagesFailed     Int       @default(0)
  
  // Erros
  errors          Json[]    // Array de erros detalhados
  
  // Metadata
  triggeredBy     String?   // "cron", "manual", "api"
  
  @@index([startedAt])
  @@index([status])
  @@map("scraping_logs")
}

model SystemConfig {
  id              String    @id @default(uuid())
  key             String    @unique
  value           String
  description     String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("system_config")
}

// ============================================
// USER MANAGEMENT (Opcional)
// ============================================

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  name            String?
  
  // Roles
  role            String    @default("user") // "admin", "user"
  
  // Status
  active          Boolean   @default(true)
  emailVerified   Boolean   @default(false)
  
  // Preferences
  timezone        String    @default("UTC")
  language        String    @default("en")
  
  // Timestamps
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("users")
}
```

### Migrations

```bash
# Criar nova migration
npx prisma migrate dev --name init

# Aplicar migrations em produção
npx prisma migrate deploy

# Reset do banco (cuidado!)
npx prisma migrate reset

# Visualizar o banco de dados
npx prisma studio
```

---

## 🔌 API Endpoints

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.adsTracker.com/api
```

### Authentication

Todos os endpoints (exceto públicos) requerem autenticação via JWT:

```bash
Authorization: Bearer <token>
```

### Endpoints Disponíveis

#### **Pages (Páginas)**

```http
# Listar todas as páginas
GET /api/pages
Query Params:
  - active: boolean (filtrar por ativas)
  - tags: string[] (filtrar por tags)
  - country: string (filtrar por país)
  - page: number (paginação)
  - limit: number (itens por página)

# Buscar página específica
GET /api/pages/:id
Params:
  - id: string (UUID ou facebookPageId)

# Criar nova página
POST /api/pages
Body: {
  "name": "cosmetica natural",
  "facebookPageId": "148977674958814",
  "url": "https://www.facebook.com/ads/library/?...",
  "country": "BR",
  "language": "es",
  "category": "ecommerce",
  "tags": ["lowticket", "latam", "espanhol"]
}

# Atualizar página
PUT /api/pages/:id
Body: {
  "name": "novo nome",
  "tags": ["tag1", "tag2"],
  "scrapingEnabled": true
}

# Deletar página
DELETE /api/pages/:id

# Executar scraping manual para uma página
POST /api/pages/:id/scrape

# Executar scraping para todas as páginas
POST /api/pages/scrape-all
```

#### **Snapshots (Coletas)**

```http
# Listar snapshots de uma página
GET /api/snapshots
Query Params:
  - pageId: string (required)
  - startDate: ISO date
  - endDate: ISO date
  - limit: number

# Buscar snapshot específico
GET /api/snapshots/:id

# Buscar último snapshot de uma página
GET /api/snapshots/latest/:pageId

# Comparar snapshots entre períodos
GET /api/snapshots/compare
Query Params:
  - pageId: string
  - date1: ISO date
  - date2: ISO date
```

#### **Metrics (Métricas)**

```http
# Obter métricas de uma página
GET /api/metrics/:pageId
Query Params:
  - startDate: ISO date
  - endDate: ISO date
  - granularity: "daily" | "weekly" | "monthly"

# Obter métricas agregadas
GET /api/metrics/:pageId/summary
Query Params:
  - period: "7d" | "30d" | "90d" | "1y"

# Calcular métricas manualmente
POST /api/metrics/calculate
Body: {
  "pageId": "uuid",
  "date": "2025-01-17"
}

# Obter tendências
GET /api/metrics/:pageId/trends
Query Params:
  - days: number (default: 30)

# Comparar múltiplas páginas
POST /api/metrics/compare
Body: {
  "pageIds": ["uuid1", "uuid2", "uuid3"],
  "startDate": "2025-01-01",
  "endDate": "2025-01-17"
}
```

#### **Analytics (Análises)**

```http
# Dashboard overview
GET /api/analytics/overview
Query Params:
  - period: "today" | "7d" | "30d"

# Top performers (páginas com mais crescimento)
GET /api/analytics/top-performers
Query Params:
  - metric: "total_ads" | "growth_rate"
  - period: "7d" | "30d"
  - limit: number

# Detecção de anomalias
GET /api/analytics/anomalies
Query Params:
  - pageId: string (optional)
  - startDate: ISO date
  - endDate: ISO date

# Exportar dados
GET /api/analytics/export
Query Params:
  - pageId: string
  - format: "csv" | "excel" | "json"
  - startDate: ISO date
  - endDate: ISO date
```

#### **Alerts (Alertas)**

```http
# Listar alertas
GET /api/alerts
Query Params:
  - pageId: string (optional)
  - enabled: boolean (optional)

# Criar alerta
POST /api/alerts
Body: {
  "pageId": "uuid",
  "name": "Queda significativa",
  "type": "percentage_change",
  "condition": "less_than",
  "threshold": -20,
  "channels": ["email", "slack"],
  "recipients": ["email@example.com"]
}

# Atualizar alerta
PUT /api/alerts/:id

# Deletar alerta
DELETE /api/alerts/:id

# Testar alerta
POST /api/alerts/:id/test
```

#### **System (Sistema)**

```http
# Health check
GET /api/health

# System stats
GET /api/system/stats

# Logs de scraping
GET /api/system/logs
Query Params:
  - limit: number
  - status: "running" | "completed" | "failed"

# Configurações
GET /api/system/config
PUT /api/system/config
Body: {
  "key": "value"
}
```

### Exemplos de Requests

#### Criar uma nova página

```bash
curl -X POST http://localhost:5000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Loja Exemplo",
    "facebookPageId": "123456789",
    "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=123456789",
    "country": "BR",
    "tags": ["ecommerce", "fashion"]
  }'
```

#### Obter métricas dos últimos 30 dias

```bash
curl -X GET "http://localhost:5000/api/metrics/PAGE_ID?period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Executar scraping manual

```bash
curl -X POST http://localhost:5000/api/pages/PAGE_ID/scrape \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Format

Todas as respostas seguem o padrão:

```typescript
// Success
{
  "success": true,
  "data": {
    // ... dados retornados
  },
  "message": "Optional success message",
  "meta": {
    "timestamp": "2025-01-17T10:00:00Z",
    "version": "1.0.0"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "facebookPageId",
      "issue": "Must be a valid Facebook page ID"
    }
  },
  "meta": {
    "timestamp": "2025-01-17T10:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos |
| `UNAUTHORIZED` | 401 | Token ausente ou inválido |
| `FORBIDDEN` | 403 | Sem permissão para o recurso |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `CONFLICT` | 409 | Conflito (ex: página já existe) |
| `RATE_LIMIT` | 429 | Limite de requisições excedido |
| `SCRAPING_ERROR` | 500 | Erro durante scraping |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

---

## 🕷️ Sistema de Scraping

### Arquitetura do Scraper

```typescript
// backend/src/services/scraperService.ts

import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export class FacebookAdsScraper {
  private browser: Browser | null = null;
  
  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: process.env.SCRAPER_HEADLESS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }
  
  async scrapePageAds(pageUrl: string): Promise<ScrapedData> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    
    try {
      // Configure viewport e user agent
      await page.setViewport({
        width: parseInt(process.env.SCRAPER_VIEWPORT_WIDTH || '1920'),
        height: parseInt(process.env.SCRAPER_VIEWPORT_HEIGHT || '1080')
      });
      
      await page.setUserAgent(
        process.env.SCRAPER_USER_AGENT || 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
      
      // Navegar para a página
      logger.info(`Navigating to: ${pageUrl}`);
      await page.goto(pageUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Aguardar elementos carregarem
      await page.waitForSelector('[role="main"]', { timeout: 15000 });
      
      // Scroll para carregar conteúdo lazy-loaded
      await this.autoScroll(page);
      
      // Extrair dados
      const data = await page.evaluate(() => {
        // Selecionar o contador de anúncios
        const adsCountElement = document.querySelector(
          '[data-testid="ads-count"], .ads-library-count'
        );
        
        if (!adsCountElement) {
          throw new Error('Ads count element not found');
        }
        
        // Extrair número do texto (ex: "259 ads" -> 259)
        const text = adsCountElement.textContent || '0';
        const match = text.match(/(\d+)/);
        const totalAds = match ? parseInt(match[1], 10) : 0;
        
        // Coletar metadados adicionais
        const pageNameElement = document.querySelector('h1, [role="heading"]');
        const pageName = pageNameElement?.textContent || '';
        
        return {
          totalAds,
          pageName,
          scrapedAt: new Date().toISOString()
        };
      });
      
      logger.info(`Scraped data:`, data);
      return data;
      
    } catch (error) {
      logger.error(`Scraping error:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }
  
  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
  
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Service com retry logic
export class ScraperService {
  private scraper: FacebookAdsScraper;
  
  constructor() {
    this.scraper = new FacebookAdsScraper();
  }
  
  async scrapeWithRetry(
    pageUrl: string,
    maxRetries: number = 3
  ): Promise<ScrapedData> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Scraping attempt ${attempt}/${maxRetries}`);
        const data = await this.scraper.scrapePageAds(pageUrl);
        return data;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Scraping failed');
  }
  
  async scrapeAllPages(): Promise<void> {
    const pages = await prisma.page.findMany({
      where: {
        active: true,
        scrapingEnabled: true
      }
    });
    
    logger.info(`Starting scraping for ${pages.length} pages`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ pageId: string; error: string }>
    };
    
    for (const page of pages) {
      try {
        const data = await this.scrapeWithRetry(page.url);
        
        // Salvar snapshot
        await prisma.adSnapshot.create({
          data: {
            pageId: page.id,
            totalAds: data.totalAds,
            timestamp: new Date(),
            date: new Date(new Date().setHours(0, 0, 0, 0)),
            collectionPeriod: page.scrapePeriod,
            success: true
          }
        });
        
        // Atualizar página
        await prisma.page.update({
          where: { id: page.id },
          data: { lastScrapedAt: new Date() }
        });
        
        results.success++;
        logger.info(`✓ Page ${page.name}: ${data.totalAds} ads`);
        
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ pageId: page.id, error: errorMsg });
        logger.error(`✗ Page ${page.name} failed:`, error);
        
        // Salvar snapshot com erro
        await prisma.adSnapshot.create({
          data: {
            pageId: page.id,
            totalAds: 0,
            timestamp: new Date(),
            date: new Date(new Date().setHours(0, 0, 0, 0)),
            success: false,
            errorMessage: errorMsg
          }
        });
      }
      
      // Delay entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    logger.info(`Scraping completed: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

interface ScrapedData {
  totalAds: number;
  pageName: string;
  scrapedAt: string;
}
```

### Cron Jobs

```typescript
// backend/src/jobs/schedulers/cronJobs.ts

import cron from 'node-cron';
import { ScraperService } from '../../services/scraperService';
import { MetricsService } from '../../services/metricsService';
import { logger } from '../../utils/logger';

export class CronScheduler {
  private scraperService: ScraperService;
  private metricsService: MetricsService;
  
  constructor() {
    this.scraperService = new ScraperService();
    this.metricsService = new MetricsService();
  }
  
  startJobs(): void {
    // Scraping diário às 6h
    cron.schedule(process.env.CRON_DAILY_SCRAPE || '0 6 * * *', async () => {
      logger.info('Starting daily scraping job');
      try {
        await this.scraperService.scrapeAllPages();
      } catch (error) {
        logger.error('Daily scraping job failed:', error);
      }
    });
    
    // Cálculo de métricas às 7h
    cron.schedule(process.env.CRON_METRICS_CALC || '0 7 * * *', async () => {
      logger.info('Starting metrics calculation job');
      try {
        await this.metricsService.calculateAllMetrics();
      } catch (error) {
        logger.error('Metrics calculation job failed:', error);
      }
    });
    
    // Cleanup de logs antigos (semanal, domingo 2h)
    cron.schedule('0 2 * * 0', async () => {
      logger.info('Starting cleanup job');
      try {
        await this.cleanupOldLogs();
      } catch (error) {
        logger.error('Cleanup job failed:', error);
      }
    });
    
    logger.info('Cron jobs initialized');
  }
  
  private async cleanupOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.scrapingLog.deleteMany({
      where: {
        startedAt: {
          lt: thirtyDaysAgo
        }
      }
    });
  }
}
```

### Estratégias Anti-Bloqueio

```typescript
// backend/src/utils/antiBlock.ts

export const antiBlockStrategies = {
  // User agents rotativos
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ],
  
  // Random delays
  getRandomDelay: (min: number = 2000, max: number = 5000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Comportamento humano
  async simulateHumanBehavior(page: Page): Promise<void> {
    // Movimento do mouse aleatório
    await page.mouse.move(
      Math.random() * 1000,
      Math.random() * 800
    );
    
    // Scroll suave
    await page.evaluate(() => {
      window.scrollBy({
        top: 100 + Math.random() * 200,
        behavior: 'smooth'
      });
    });
    
    // Delay aleatório
    await new Promise(resolve => 
      setTimeout(resolve, this.getRandomDelay(1000, 3000))
    );
  }
};
```

---

## 🎨 Dashboard Interface

### Componentes Principais

#### 1. PageCard Component

```typescript
// frontend/src/components/dashboard/PageCard.tsx

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Page, Metric } from '../../types';

interface PageCardProps {
  page: Page;
  currentMetric: Metric;
  previousMetric?: Metric;
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  currentMetric,
  previousMetric
}) => {
  const getTrendIcon = () => {
    if (!currentMetric.dailyChange) return <Minus className="w-4 h-4" />;
    return currentMetric.dailyChange > 0 
      ? <TrendingUp className="w-4 h-4 text-green-500" />
      : <TrendingDown className="w-4 h-4 text-red-500" />;
  };
  
  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };
  
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-semibold text-lg">{page.name}</h3>
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-white">
            <Edit className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Weekly Variation */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Variação semanal</p>
          <p className={`text-sm ${getChangeColor(currentMetric.weeklyChange)}`}>
            {currentMetric.weeklyChange > 0 ? '+' : ''}
            {currentMetric.weeklyChange} Anúncios ativos
            {getTrendIcon()}
          </p>
        </div>
        
        {/* Daily Variation */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Variação diária</p>
          <p className={`text-sm ${getChangeColor(currentMetric.dailyChange)}`}>
            {currentMetric.dailyChange > 0 ? '+' : ''}
            {currentMetric.dailyChange} Anúncios ativos
          </p>
        </div>
      </div>
      
      {/* Current vs Previous */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-blue-600 text-white px-4 py-2 rounded">
          <span className="text-sm">Hoje: </span>
          <span className="font-bold text-lg">{currentMetric.totalAds}</span>
        </div>
        
        <div className="text-gray-300">
          <span className="text-sm">Ontem: </span>
          <span className="font-semibold">{previousMetric?.totalAds || 0}</span>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {page.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
```

#### 2. MetricsChart Component

```typescript
// frontend/src/components/dashboard/MetricsChart.tsx

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetricsChartProps {
  data: Array<{
    date: string;
    totalAds: number;
  }>;
  height?: number;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ 
  data, 
  height = 400 
}) => {
  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR })
  }));
  
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-white font-semibold mb-4">Análise da Oferta</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          
          <Area
            type="monotone"
            dataKey="totalAds"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorAds)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Design System

```typescript
// frontend/src/styles/theme.ts

export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  }
};
```

---

## 🚀 Deployment

### Docker Production Setup

```dockerfile
# docker/Dockerfile.backend

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: facebook_ads_tracker
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/facebook_ads_tracker
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:5000"
    restart: unless-stopped
  
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    environment:
      REACT_APP_API_URL: ${API_URL}
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Deploy em VPS (DigitalOcean/AWS/etc)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/facebook-ads-tracker.git
cd facebook-ads-tracker

# 2. Configure variáveis de ambiente
cp .env.example .env
nano .env

# 3. Build e inicie os containers
docker-compose -f docker-compose.prod.yml up -d

# 4. Execute migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Verifique os logs
docker-compose logs -f
```

### Deploy em Vercel + Railway

```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway up
railway run npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Problema: Scraper não consegue acessar Facebook

**Solução:**
```bash
# Verifique se o Chromium está instalado corretamente
docker-compose exec backend chromium-browser --version

# Teste o scraper manualmente
docker-compose exec backend npm run scrape:test

# Verifique os logs
docker-compose logs backend | grep -i scraper
```

### Problema: Métricas não calculando

**Solução:**
```bash
# Execute cálculo manual
curl -X POST http://localhost:5000/api/metrics/calculate \
  -H "Content-Type: application/json" \
  -d '{"pageId": "YOUR_PAGE_ID"}'

# Verifique cron jobs
docker-compose exec backend node -e "console.log(require('node-cron').validate('0 6 * * *'))"
```

### Problema: Alto uso de memória

**Solução:**
```yaml
# docker-compose.yml - Adicionar limites
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

---

## 🗺️ Roadmap

### v1.0 - MVP (Q1 2025)
- [x] Sistema de scraping básico
- [x] Dashboard com métricas principais
- [x] API REST completa
- [x] Armazenamento de histórico
- [x] Gráficos de tendências

