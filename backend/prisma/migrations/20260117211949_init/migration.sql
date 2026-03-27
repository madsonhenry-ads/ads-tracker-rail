-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facebookPageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT,
    "language" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastScrapedAt" TIMESTAMP(3),
    "scrapingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scrapePeriod" TEXT NOT NULL DEFAULT '8d',
    "scrapeFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_snapshots" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "totalAds" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "collectionPeriod" TEXT NOT NULL DEFAULT '8d',
    "scrapeDuration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAds" INTEGER NOT NULL,
    "dailyChange" INTEGER,
    "weeklyChange" INTEGER,
    "monthlyChange" INTEGER,
    "dailyChangePercent" DOUBLE PRECISION,
    "weeklyChangePercent" DOUBLE PRECISION,
    "monthlyChangePercent" DOUBLE PRECISION,
    "movingAvg7d" DOUBLE PRECISION,
    "movingAvg30d" DOUBLE PRECISION,
    "maxAdsLast7d" INTEGER,
    "minAdsLast7d" INTEGER,
    "avgAdsLast7d" DOUBLE PRECISION,
    "trend" TEXT,
    "anomalyDetected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_logs" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL,
    "pagesScraped" INTEGER NOT NULL DEFAULT 0,
    "pagesSuccess" INTEGER NOT NULL DEFAULT 0,
    "pagesFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB[],
    "triggeredBy" TEXT,

    CONSTRAINT "scraping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_facebookPageId_key" ON "pages"("facebookPageId");

-- CreateIndex
CREATE INDEX "pages_facebookPageId_idx" ON "pages"("facebookPageId");

-- CreateIndex
CREATE INDEX "pages_active_idx" ON "pages"("active");

-- CreateIndex
CREATE INDEX "ad_snapshots_pageId_date_idx" ON "ad_snapshots"("pageId", "date");

-- CreateIndex
CREATE INDEX "ad_snapshots_timestamp_idx" ON "ad_snapshots"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ad_snapshots_pageId_date_key" ON "ad_snapshots"("pageId", "date");

-- CreateIndex
CREATE INDEX "metrics_pageId_date_idx" ON "metrics"("pageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_pageId_date_key" ON "metrics"("pageId", "date");

-- CreateIndex
CREATE INDEX "scraping_logs_startedAt_idx" ON "scraping_logs"("startedAt");

-- CreateIndex
CREATE INDEX "scraping_logs_status_idx" ON "scraping_logs"("status");

-- AddForeignKey
ALTER TABLE "ad_snapshots" ADD CONSTRAINT "ad_snapshots_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
