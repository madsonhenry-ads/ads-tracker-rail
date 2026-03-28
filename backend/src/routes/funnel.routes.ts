import { Router } from 'express';
import { enumerateSubdomains, mapFunnel, uncloakUrl, swapProxyIp, getPageAds, getAllPageAds, scrapePageAds, transcribeAdVideo } from '../controllers/funnelController.js';

const router = Router();

router.post('/subdomains', enumerateSubdomains);
router.post('/map', mapFunnel);
router.post('/uncloak', uncloakUrl);
router.post('/swap-ip', swapProxyIp);
router.get('/ads/:pageId', getPageAds);
router.get('/ads/:pageId/all', getAllPageAds);
router.post('/ads/scrape', scrapePageAds);
router.post('/ads/transcribe', transcribeAdVideo);

export default router;
