
import { adLibraryScraper } from './src/services/adLibraryScraper';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '.env') });

(async () => {
    try {
        console.log('Starting scrape for Page ID 926113033923066...');
        const result = await adLibraryScraper.scrapePageAds('926113033923066');
        console.log('Total Ads Found:', result.totalAdsFound);

        if (result.ads.length > 0) {
            console.log('First 3 Ads Sample:');
            result.ads.slice(0, 3).forEach((ad, i) => {
                console.log(`[${i}] ID: ${ad.id}`);
                console.log(`    Date: ${ad.ad_delivery_start_time}`);
                console.log(`    Image: ${ad.thumbnail_url ? 'Yes' : 'No'}`);
            });
        } else {
            console.log('No ads found.');
        }

    } catch (error) {
        console.error('Error during test scrape:', error);
    } finally {
        process.exit(0);
    }
})();
