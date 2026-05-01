import prisma from '../config/database.js';
import logger from '../utils/logger.js';

interface ScrapingResult {
    success: boolean;
    totalAds: number;
    error?: string;
    duration: number;
}

class ScraperService {
    private readonly maxRetries = parseInt(process.env.SCRAPER_MAX_RETRIES || '2');
    private readonly retryDelay = parseInt(process.env.SCRAPER_RETRY_DELAY || '5000');

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Scrape de uma página via Apify (curious_coder/facebook-ads-library-scraper).
     *
     * POR QUÊ o Apify?
     * O Facebook mudou o HTML/estrutura da Ads Library e o Puppeteer puro parou de
     * conseguir extrair o número de anúncios — retornava 0 para toda página.
     * O Apify usa proxies residenciais e scraping especializado que lida com essas
     * mudanças automaticamente.
     */
    async scrapePage(pageUrl: string): Promise<ScrapingResult> {
        const startTime = Date.now();
        const apifyToken = process.env.APIFY_TOKEN;

        if (!apifyToken) {
            logger.error('APIFY_TOKEN não configurado no .env — scrape não pode ser executado');
            return { success: false, totalAds: 0, error: 'APIFY_TOKEN not configured', duration: 0 };
        }

        // Extrair Facebook Page ID da URL da Ads Library
        const pageIdMatch = pageUrl.match(/view_all_page_id=(\d+)/);
        if (!pageIdMatch) {
            logger.error(`Não foi possível extrair Facebook Page ID da URL: ${pageUrl}`);
            return { success: false, totalAds: 0, error: 'Invalid page URL format', duration: Date.now() - startTime };
        }
        const facebookPageId = pageIdMatch[1];

        // URL da Ads Library com filtro de anúncios ativos para esta página
        const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&view_all_page_id=${facebookPageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

        logger.info(`🚀 [Apify] Iniciando scrape da página ${facebookPageId}...`);

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.info(`   Tentativa ${attempt}/${this.maxRetries}`);

                // 1. Iniciar o run do Actor no Apify
                const runResponse = await fetch(
                    `https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs?token=${apifyToken}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            urls: [{ url: adsLibraryUrl }],
                            count: 200,
                            scrapePageAds: {
                                activeStatus: 'active',
                                countryCode: 'ALL',
                                sortBy: 'impressions_desc'
                            },
                            proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] }
                        })
                    }
                );

                if (!runResponse.ok) {
                    const errText = await runResponse.text();
                    throw new Error(`Apify falhou ao iniciar: ${runResponse.status} — ${errText}`);
                }

                const runData = await runResponse.json() as any;
                const runId = runData.data?.id;
                const datasetId = runData.data?.defaultDatasetId;
                if (!runId) throw new Error('Apify não retornou um run ID');

                logger.info(`   ✅ Run iniciado: ${runId} | Dataset: ${datasetId}`);

                // 2. Poll até concluir (máx 3 minutos)
                let status = 'RUNNING';
                let pollAttempts = 0;
                const maxPollAttempts = 36; // 36 × 5s = 3 min

                while ((status === 'RUNNING' || status === 'READY') && pollAttempts < maxPollAttempts) {
                    await this.delay(5000);
                    pollAttempts++;

                    const statusResp = await fetch(
                        `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
                    );

                    if (!statusResp.ok) {
                        const errorText = await statusResp.text();
                        console.warn(`    ⚠️ [Apify] Erro na polling (Status: ${statusResp.status}):`, errorText.substring(0, 200));
                        throw new Error(`Polling failed with status ${statusResp.status}`);
                    }

                    const statusData = await statusResp.json() as any;
                    status = statusData.data?.status || 'UNKNOWN';
                    logger.info(`   ⏳ Status: ${status} (${pollAttempts * 5}s)`);
                }

                if (status !== 'SUCCEEDED') {
                    throw new Error(`Run encerrado com status inesperado: ${status}`);
                }

                // 3. Buscar resultados do dataset
                const resultsResp = await fetch(
                    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=500`
                );
                const items = await resultsResp.json() as any[];
                const totalAds = Array.isArray(items) ? items.length : 0;
                const duration = Date.now() - startTime;

                logger.info(`✅ [Apify] Página ${facebookPageId}: ${totalAds} anúncios ativos encontrados (${duration}ms)`);
                return { success: true, totalAds, duration };

            } catch (error: any) {
                logger.warn(`   ⚠️ Tentativa ${attempt} falhou: ${error.message}`);

                if (attempt < this.maxRetries) {
                    const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
                    logger.info(`   Próxima tentativa em ${backoffDelay}ms...`);
                    await this.delay(backoffDelay);
                } else {
                    return {
                        success: false,
                        totalAds: 0,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
        }

        return {
            success: false,
            totalAds: 0,
            error: 'Máximo de tentativas atingido',
            duration: Date.now() - startTime
        };
    }

    async scrapeAllPages(): Promise<{
        total: number;
        success: number;
        failed: number;
        results: Array<{ pageId: string; pageName: string; result: ScrapingResult }>;
    }> {
        const pages = await prisma.page.findMany({
            where: {
                active: true,
                scrapingEnabled: true
            }
        });

        logger.info(`Iniciando scrape em lote de ${pages.length} páginas`);

        const results: Array<{ pageId: string; pageName: string; result: ScrapingResult }> = [];
        let successCount = 0;
        let failedCount = 0;

        // Criar log de scraping
        const scrapingLog = await prisma.scrapingLog.create({
            data: {
                status: 'running',
                triggeredBy: 'api',
                pagesScraped: pages.length
            }
        });

        try {
            for (const page of pages) {
                const result = await this.scrapePage(page.url);
                results.push({ pageId: page.id, pageName: page.name, result });

                if (result.success) {
                    successCount++;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    await prisma.adSnapshot.upsert({
                        where: { pageId_date: { pageId: page.id, date: today } },
                        update: {
                            totalAds: result.totalAds,
                            timestamp: new Date(),
                            scrapeDuration: result.duration,
                            success: true
                        },
                        create: {
                            pageId: page.id,
                            totalAds: result.totalAds,
                            date: today,
                            scrapeDuration: result.duration,
                            success: true
                        }
                    });

                    await prisma.page.update({
                        where: { id: page.id },
                        data: { lastScrapedAt: new Date() }
                    });

                    await this.calculateMetrics(page.id);
                } else {
                    failedCount++;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    await prisma.adSnapshot.upsert({
                        where: { pageId_date: { pageId: page.id, date: today } },
                        update: {
                            success: false,
                            errorMessage: result.error,
                            scrapeDuration: result.duration
                        },
                        create: {
                            pageId: page.id,
                            totalAds: 0,
                            date: today,
                            success: false,
                            errorMessage: result.error,
                            scrapeDuration: result.duration
                        }
                    });

                    logger.warn(`   ❌ Falha na página ${page.name}: ${result.error}`);
                }

                // Pausa entre páginas para não sobrecarregar o Apify
                await this.delay(3000);
            }

            await prisma.scrapingLog.update({
                where: { id: scrapingLog.id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    duration: Date.now() - scrapingLog.startedAt.getTime(),
                    pagesSuccess: successCount,
                    pagesFailed: failedCount
                }
            });

        } catch (error: any) {
            logger.error(`Erro fatal no scrape em lote: ${error.message}`);
            try {
                await prisma.scrapingLog.update({
                    where: { id: scrapingLog.id },
                    data: {
                        status: 'failed',
                        completedAt: new Date(),
                        duration: Date.now() - scrapingLog.startedAt.getTime(),
                        pagesSuccess: successCount,
                        pagesFailed: failedCount
                    }
                });
            } catch (updateError) {
                logger.error('Falhou ao atualizar log de scraping:', updateError);
            }
            throw error;
        }

        logger.info(`Scrape em lote concluído: ${successCount} sucesso, ${failedCount} falha`);

        return { total: pages.length, success: successCount, failed: failedCount, results };
    }

    private async calculateMetrics(pageId: string): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshots = await prisma.adSnapshot.findMany({
            where: {
                pageId,
                success: true,
                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            orderBy: { date: 'desc' }
        });

        if (snapshots.length === 0) return;

        const todaySnapshot = snapshots[0];
        const yesterdaySnapshot = snapshots.find(s => s.date.getTime() < todaySnapshot.date.getTime());
        const weekAgoTime = today.getTime() - 7 * 24 * 60 * 60 * 1000;
        const snapshotsLast7Days = snapshots.filter(s => s.date.getTime() >= weekAgoTime);
        const weekAgoSnapshot = snapshotsLast7Days.length > 0 ? snapshotsLast7Days[snapshotsLast7Days.length - 1] : null;
        const monthAgoTime = today.getTime() - 30 * 24 * 60 * 60 * 1000;
        const snapshotsLast30Days = snapshots.filter(s => s.date.getTime() >= monthAgoTime);
        const monthAgoSnapshot = snapshotsLast30Days.length > 0 ? snapshotsLast30Days[snapshotsLast30Days.length - 1] : null;

        const dailyChange = yesterdaySnapshot ? todaySnapshot.totalAds - yesterdaySnapshot.totalAds : null;
        const weeklyChange = weekAgoSnapshot ? todaySnapshot.totalAds - weekAgoSnapshot.totalAds : null;
        const monthlyChange = monthAgoSnapshot ? todaySnapshot.totalAds - monthAgoSnapshot.totalAds : null;

        const dailyChangePercent = yesterdaySnapshot && yesterdaySnapshot.totalAds > 0 ? (dailyChange! / yesterdaySnapshot.totalAds) * 100 : null;
        const weeklyChangePercent = weekAgoSnapshot && weekAgoSnapshot.totalAds > 0 ? (weeklyChange! / weekAgoSnapshot.totalAds) * 100 : null;
        const monthlyChangePercent = monthAgoSnapshot && monthAgoSnapshot.totalAds > 0 ? (monthlyChange! / monthAgoSnapshot.totalAds) * 100 : null;

        const last7 = snapshots.slice(0, 7);
        const last30 = snapshots.slice(0, 30);
        const movingAvg7d = last7.length > 0 ? last7.reduce((sum, s) => sum + s.totalAds, 0) / last7.length : null;
        const movingAvg30d = last30.length > 0 ? last30.reduce((sum, s) => sum + s.totalAds, 0) / last30.length : null;

        let trend = 'stable';
        if (dailyChange && Math.abs(dailyChange) > 0) {
            trend = dailyChange > 0 ? 'up' : 'down';
        }

        const adsValues = last7.map(s => s.totalAds);
        const maxAdsLast7d = adsValues.length > 0 ? Math.max(...adsValues) : null;
        const minAdsLast7d = adsValues.length > 0 ? Math.min(...adsValues) : null;

        await prisma.metric.upsert({
            where: { pageId_date: { pageId, date: today } },
            update: {
                totalAds: todaySnapshot.totalAds,
                dailyChange,
                weeklyChange,
                monthlyChange,
                dailyChangePercent,
                weeklyChangePercent,
                monthlyChangePercent,
                movingAvg7d,
                movingAvg30d,
                maxAdsLast7d,
                minAdsLast7d,
                avgAdsLast7d: movingAvg7d,
                trend,
                updatedAt: new Date()
            },
            create: {
                pageId,
                date: today,
                totalAds: todaySnapshot.totalAds,
                dailyChange,
                weeklyChange,
                monthlyChange,
                dailyChangePercent,
                weeklyChangePercent,
                monthlyChangePercent,
                movingAvg7d,
                movingAvg30d,
                maxAdsLast7d,
                minAdsLast7d,
                avgAdsLast7d: movingAvg7d,
                trend
            }
        });

        logger.info(`Métricas calculadas para página ${pageId}`);
    }

    async cleanupStuckLogs(): Promise<void> {
        try {
            logger.info('Limpando logs presos...');
            const result = await prisma.scrapingLog.updateMany({
                where: { status: 'running' },
                data: { status: 'failed', completedAt: new Date() }
            });
            if (result.count > 0) {
                logger.info(`${result.count} logs presos limpos.`);
            }
        } catch (error) {
            logger.error('Falhou ao limpar logs presos:', error);
        }
    }
}

export const scraperService = new ScraperService();
export default scraperService;
