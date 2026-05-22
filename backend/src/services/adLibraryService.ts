import axios from 'axios';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

// --- Types ---

interface AdCreative {
    body?: string;
    title?: string;
    link_url?: string;
    link_caption?: string;
    link_description?: string;
    call_to_action_type?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
}

interface AdVersion {
    id: string;
    ad_creative_bodies?: string[];
    ad_creative_link_titles?: string[];
    ad_creative_link_captions?: string[];
    ad_creative_link_descriptions?: string[];
    ad_delivery_start_time?: string;
    ad_delivery_stop_time?: string;
    ad_snapshot_url?: string;
    bylines?: string;
    currency?: string;
    impressions?: { lower_bound: string; upper_bound: string };
    spend?: { lower_bound: string; upper_bound: string };
    languages?: string[];
    page_id?: string;
    page_name?: string;
    publisher_platforms?: string[];
    target_locations?: any[];
    demographic_distribution?: any[];
    delivery_by_region?: any[];
    estimated_audience_size?: { lower_bound: number; upper_bound: number };
}

interface AdLibraryResult {
    pageId: string;
    pageName: string;
    totalAds: number;
    ads: AdVersion[];
    hasMore: boolean;
    nextCursor?: string;
}

// --- Service ---

export class AdLibraryService {
    private accessToken = process.env.META_ACCESS_TOKEN || '';
    private apiBase = 'https://graph.facebook.com/v19.0';

    /**
     * Fetch all ad variations for a page from the Meta Ad Library API
     */
    async getPageAds(
        pageId: string,
        options: {
            limit?: number;
            country?: string;
            adActiveStatus?: string;
            cursor?: string;
        } = {}
    ): Promise<AdLibraryResult> {
        const {
            limit = 50,
            country = 'ALL',
            adActiveStatus = 'active',
            cursor,
        } = options;

        if (!this.accessToken) {
            throw new Error('META_ACCESS_TOKEN not configured in .env');
        }

        logger.info(`📚 Fetching ads for page ${pageId} (limit: ${limit}, country: ${country})`);

        try {
            const params: Record<string, string> = {
                access_token: this.accessToken,
                search_page_ids: pageId,
                ad_reached_countries: country,
                ad_active_status: adActiveStatus.toUpperCase(),
                ad_type: 'ALL',
                limit: String(limit),
                fields: [
                    'id',
                    'ad_creative_bodies',
                    'ad_creative_link_titles',
                    'ad_creative_link_captions',
                    'ad_creative_link_descriptions',
                    'ad_delivery_start_time',
                    'ad_delivery_stop_time',
                    'ad_snapshot_url',
                    'bylines',
                    'currency',
                    'impressions',
                    'spend',
                    'languages',
                    'page_id',
                    'page_name',
                    'publisher_platforms',
                    'estimated_audience_size',
                    'demographic_distribution',
                    'delivery_by_region',
                    'target_locations',
                    'media_type'
                ].join(','),
            };

            if (cursor) {
                params.after = cursor;
            }

            const response = await axios.get(`${this.apiBase}/ads_archive`, { params });

            const data = response.data;
            const ads: AdVersion[] = data.data || [];
            const paging = data.paging || {};
            const hasMore = !!paging.next;
            const nextCursor = paging.cursors?.after;

            const pageName = ads.length > 0 ? (ads[0].page_name || 'Unknown') : 'Unknown';

            logger.info(`✅ Found ${ads.length} ads for page ${pageId} (${pageName}). HasMore: ${hasMore}`);

            return {
                pageId,
                pageName,
                totalAds: ads.length,
                ads,
                hasMore,
                nextCursor,
            };
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;
            logger.error(`❌ Meta Ad Library API error: ${errMsg}`);
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    }

    /**
     * Fetch ALL ads (paginating through all pages)
     */
    async getAllPageAds(
        pageId: string,
        options: { country?: string; adActiveStatus?: string; maxPages?: number } = {}
    ): Promise<AdLibraryResult> {
        const { maxPages = 10, ...baseOptions } = options;
        let allAds: AdVersion[] = [];
        let cursor: string | undefined;
        let pageName = 'Unknown';
        let page = 0;

        do {
            const result = await this.getPageAds(pageId, {
                ...baseOptions,
                limit: 50,
                cursor,
            });

            allAds = allAds.concat(result.ads);
            pageName = result.pageName;
            cursor = result.nextCursor;
            page++;

            logger.info(`📄 Page ${page}: fetched ${result.ads.length} ads (total: ${allAds.length})`);

            if (!result.hasMore || page >= maxPages) break;

            // Rate limiting
            await new Promise(r => setTimeout(r, 500));
        } while (cursor);

        return {
            pageId,
            pageName,
            totalAds: allAds.length,
            ads: allAds,
            hasMore: !!cursor,
            nextCursor: cursor,
        };
    }

    /**
     * Extract unique destination URLs from all ads
     */
    extractDestinationUrls(ads: AdVersion[]): string[] {
        const urls = new Set<string>();
        ads.forEach(ad => {
            ad.ad_creative_link_captions?.forEach(caption => {
                if (caption && caption.startsWith('http')) urls.add(caption);
            });
            // Link titles sometimes contain URLs
            ad.ad_creative_link_titles?.forEach(title => {
                if (title && title.includes('.')) {
                    // Could be a domain
                    if (!title.includes(' ')) urls.add(title);
                }
            });
        });
        return Array.from(urls);
    }
}

export const adLibraryService = new AdLibraryService();

// --- Apify-based individual ad scraping ---

interface ApifyAdItem {
    id?: string;
    adId?: string;
    ad_snapshot_url?: string;
    ad_creative_body?: string;
    ad_creative_link_title?: string;
    ad_creative_link_description?: string;
    ad_delivery_start_time?: string;
    ad_delivery_stop_time?: string;
    page_id?: string;
    page_name?: string;
    publisher_platforms?: string[];
    thumbnail_url?: string;
    thumbnail?: string;
    video_url?: string;
    [key: string]: any;
}

interface ApifyScrapeResult {
    pageId: string;
    totalAdsFound: number;
    ads: ApifyAdItem[];
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function scrapePageAdsApify(
    pageId: string,
    options: { country?: string; activeStatus?: string } = {}
): Promise<ApifyScrapeResult> {
    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
        throw new Error('APIFY_TOKEN not configured — add APIFY_TOKEN to Railway environment variables');
    }

    const { country = 'ALL', activeStatus = 'active' } = options;

    logger.info(`🤖 [Apify] Iniciando scraper para página ${pageId} (country: ${country}, status: ${activeStatus})`);

    const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=${activeStatus}&ad_type=all&country=${country}&view_all_page_id=${pageId}&sort_data[mode]=total_impressions&sort_data[direction]=desc&media_type=all`;

    // 1. Start Apify run
    const runResponse = await fetch(
        `https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs?token=${apifyToken}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                urls: [{ url: adsLibraryUrl }],
                count: 200,
                scrapePageAds: {
                    activeStatus: activeStatus === 'all' ? 'all' : activeStatus,
                    countryCode: country,
                    sortBy: 'impressions_desc'
                },
                proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] }
            })
        }
    );

    if (!runResponse.ok) {
        const errText = await runResponse.text();
        throw new Error(`Apify failed to start: ${runResponse.status} — ${errText}`);
    }

    const runData = await runResponse.json() as any;
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;
    if (!runId) throw new Error('Apify did not return a run ID');

    logger.info(`   ✅ [Apify] Run started: ${runId} | Dataset: ${datasetId}`);

    // 2. Poll until completion (max 5 minutes)
    let status = 'RUNNING';
    let pollAttempts = 0;
    const maxPollAttempts = 60;

    while ((status === 'RUNNING' || status === 'READY') && pollAttempts < maxPollAttempts) {
        await delay(5000);
        pollAttempts++;

        const statusResp = await fetch(
            `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
        );

        if (!statusResp.ok) continue;

        const statusData = await statusResp.json() as any;
        status = statusData.data?.status || 'UNKNOWN';
        logger.info(`   ⏳ [Apify] Status: ${status} (${pollAttempts * 5}s)`);
    }

    if (status !== 'SUCCEEDED') {
        throw new Error(`Apify run ended with status: ${status}`);
    }

    // 3. Fetch results
    const resultsResp = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=500`
    );
    const items = await resultsResp.json() as ApifyAdItem[];
    const allAds = Array.isArray(items) ? items : [];

    logger.info(`✅ [Apify] Página ${pageId}: ${allAds.length} anúncios encontrados`);

    // Normalize ad fields — Apify can return different field names
    const ads = allAds.map((item: ApifyAdItem) => ({
        id: item.id || item.adId || '',
        ad_creative_body: item.ad_creative_body || '',
        ad_creative_link_title: item.ad_creative_link_title || '',
        ad_creative_link_description: item.ad_creative_link_description || '',
        ad_delivery_start_time: item.ad_delivery_start_time || '',
        ad_delivery_stop_time: item.ad_delivery_stop_time || '',
        ad_snapshot_url: item.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${item.id || item.adId}`,
        thumbnail_url: item.thumbnail_url || item.thumbnail || '',
        video_url: item.video_url || '',
        publisher_platforms: item.publisher_platforms || [],
        page_id: item.page_id || pageId,
        page_name: item.page_name || '',
    }));

    return {
        pageId,
        totalAdsFound: ads.length,
        ads,
    };
}

/**
 * Download ad creative media (image/video) from a Facebook ad snapshot URL.
 * Opens the snapshot page, finds the direct CDN media URL, and downloads it.
 */
export async function downloadAdMedia(
    snapshotUrl: string,
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    logger.info(`📥 [Download] Iniciando download de: ${snapshotUrl}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        // Block images/other resources so the video loads faster
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['stylesheet', 'font', 'image'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        // Wait for dynamic content
        await new Promise(r => setTimeout(r, 3000));

        const mediaInfo = await page.evaluate(() => {
            // Look for video element
            const video = document.querySelector('video');
            const videoSrc = video?.getAttribute('src') || video?.src || '';

            // Look for direct fbcdn images
            const allImages = Array.from(document.querySelectorAll('img'));
            let fbcdnImage = '';
            for (const img of allImages) {
                const src = img.getAttribute('src') || img.src || '';
                if (src.includes('fbcdn') || src.includes('.cdn.') || src.includes('_n.png') || src.includes('_o.jpg')) {
                    fbcdnImage = src;
                    break;
                }
                // Fallback: largest image
                if (!fbcdnImage && src.startsWith('http') && img.width > 100) {
                    fbcdnImage = src;
                }
            }

            return { videoSrc, imageSrc: fbcdnImage };
        });

        let directUrl = mediaInfo.videoSrc || mediaInfo.imageSrc;
        let mimeType = mediaInfo.videoSrc ? 'video/mp4' : 'image/jpeg';

        if (!directUrl) {
            // Last resort: extract from style background-image or any link
            directUrl = await page.evaluate(() => {
                const allEls = document.querySelectorAll('[style*="background-image"]');
                for (const el of Array.from(allEls)) {
                    const style = (el as HTMLElement).style.backgroundImage;
                    const match = style.match(/url\(["']?([^"')]+)["']?\)/);
                    if (match) return match[1];
                }
                return '';
            });
        }

        if (!directUrl) {
            throw new Error('Could not find media URL on the snapshot page');
        }

        logger.info(`   ✅ [Download] Mídia encontrada: ${directUrl.substring(0, 100)}...`);

        // Download the file
        const response = await axios.get(directUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'Referer': 'https://www.facebook.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const contentType = response.headers['content-type'] || mimeType;
        const buffer = Buffer.from(response.data);

        // Determine file extension
        let ext = '.mp4';
        if (contentType.includes('image/png')) ext = '.png';
        else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) ext = '.jpg';
        else if (contentType.includes('image/gif')) ext = '.gif';
        else if (contentType.includes('image/webp')) ext = '.webp';
        else if (contentType.includes('video/mp4')) ext = '.mp4';

        // Extract ad ID from snapshot URL
        const adIdMatch = snapshotUrl.match(/id=(\d+)/);
        const filename = `ad_${adIdMatch ? adIdMatch[1] : 'unknown'}${ext}`;

        logger.info(`   ✅ [Download] Arquivo baixado: ${filename} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

        return { buffer, mimeType: contentType, filename };
    } catch (error: any) {
        logger.error(`❌ [Download] Falha: ${error.message}`);
        throw error;
    } finally {
        await browser.close().catch(() => {});
    }
}
