import axios from 'axios';
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
