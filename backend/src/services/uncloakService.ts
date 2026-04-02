import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor } from 'ghost-cursor';
import axios from 'axios';
import { logger } from '../utils/logger.js';

// @ts-ignore
puppeteerExtra.use(StealthPlugin());

// --- Types ---

interface UncloakOptions {
    useProxy: boolean;
    headful: boolean;
    mobile: boolean;
    timeout: number;
}

interface RedirectStep {
    url: string;
    status: number;
    headers: Record<string, string>;
}

interface UncloakResult {
    originalUrl: string;
    finalUrl: string;
    redirectChain: RedirectStep[];
    pageTitle: string;
    screenshotBase64: string;
    htmlLength: number;
    analysis: CloakAnalysis;
    proxyUsed: string | null;
    timestamp: string;
}

interface CloakAnalysis {
    isCloaked: boolean;
    confidence: number;
    signals: string[];
    pageType: 'money_page' | 'white_page' | 'unknown';
    detectedElements: {
        hasVideo: boolean;
        hasForms: boolean;
        hasCheckout: boolean;
        hasCTA: boolean;
        hasCountdown: boolean;
        hasSocialProof: boolean;
    };
    twrDetected: boolean;
    parameters: Record<string, string>;
}

// --- Service ---

export class UncloakService {

    private proxyHost = process.env.PRIVATEPROXY_HOST || '';
    private proxyPort = process.env.PRIVATEPROXY_PORT || '5432';
    private proxyUser = process.env.PRIVATEPROXY_USER || '';
    private proxyPass = process.env.PRIVATEPROXY_PASS || '';
    private proxyApiKey = process.env.PRIVATEPROXY_API_KEY || '';
    private proxyApiUrl = process.env.PRIVATEPROXY_API_URL || '';

    /**
     * Swap proxy IP via PrivateProxy API
     */
    async swapProxyIp(): Promise<boolean> {
        if (!this.proxyApiKey) {
            logger.warn('No PrivateProxy API key configured, cannot swap IP');
            return false;
        }

        try {
            // Get subscriptions first to find the active one
            const subsResponse = await axios.get(`${this.proxyApiUrl}/package_subscriptions`, {
                auth: { username: 'api', password: this.proxyApiKey }
            });

            const activeSub = subsResponse.data.find((s: any) => s.active && s.type === 'proxy');
            if (!activeSub) {
                logger.warn('No active proxy subscription found');
                return false;
            }

            logger.info(`Found active proxy subscription: ${activeSub.id} (${activeSub.package})`);

            // Get new IP list after swap (the swap happens by re-fetching)
            const ipsResponse = await axios.get(
                `${this.proxyApiUrl}/package_subscriptions/${activeSub.id}/ips`,
                { auth: { username: 'api', password: this.proxyApiKey } }
            );

            const ipLine = ipsResponse.data.split('\n')[0];
            if (ipLine) {
                const parts = ipLine.split(':');
                this.proxyHost = parts[0];
                this.proxyPort = parts[1] || '5432';
                if (parts[2]) this.proxyUser = parts[2];
                if (parts[3]) this.proxyPass = parts[3];
                logger.info(`Proxy IP updated: ${this.proxyHost}:${this.proxyPort}`);
            }

            return true;
        } catch (error: any) {
            logger.error('Failed to swap proxy IP:', error.message);
            return false;
        }
    }

    /**
     * Main uncloak method — simulates a real Facebook user to reveal money pages
     */
    async uncloak(url: string, options: Partial<UncloakOptions> = {}): Promise<UncloakResult> {
        const opts: UncloakOptions = {
            useProxy: options.useProxy ?? true,
            headful: options.headful ?? false,
            mobile: options.mobile ?? true,
            timeout: options.timeout ?? 30000,
        };

        // Ensure URL has protocol
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        logger.info(`🔓 Starting uncloak for: ${url}`);
        logger.info(`Options: proxy=${opts.useProxy}, headful=${opts.headful}, mobile=${opts.mobile}`);

        // Build launch args
        const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];
        let proxyUsed: string | null = null;

        if (opts.useProxy && this.proxyHost) {
            const proxyUrl = `${this.proxyHost}:${this.proxyPort}`;
            launchArgs.push(`--proxy-server=http://${proxyUrl}`);
            proxyUsed = proxyUrl;
            logger.info(`🌐 Using proxy: ${proxyUrl}`);
        }

        const browser = await (puppeteerExtra as any).launch({
            headless: !opts.headful,
            args: launchArgs,
            defaultViewport: null,
        });

        try {
            const page = await browser.newPage();

            // Proxy authentication
            if (opts.useProxy && this.proxyUser && this.proxyPass) {
                await page.authenticate({
                    username: this.proxyUser,
                    password: this.proxyPass,
                });
            }

            // --- Device Emulation ---
            if (opts.mobile) {
                await page.setUserAgent(
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
                );
                await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
            } else {
                await page.setUserAgent(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                );
                await page.setViewport({ width: 1920, height: 1080 });
            }

            // --- Facebook Referrer Spoofing ---
            await page.setExtraHTTPHeaders({
                'Referer': 'https://l.facebook.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            });

            // --- Track Redirect Chain ---
            const redirectChain: RedirectStep[] = [];

            page.on('response', (response) => {
                const status = response.status();
                if (status >= 300 && status < 400) {
                    redirectChain.push({
                        url: response.url(),
                        status,
                        headers: response.headers(),
                    });
                }
            });

            // Also track client-side navigations
            page.on('framenavigated', (frame) => {
                if (frame === page.mainFrame()) {
                    redirectChain.push({
                        url: frame.url(),
                        status: 200,
                        headers: {},
                    });
                }
            });

            // --- Navigate ---
            logger.info('🚀 Navigating to URL...');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: opts.timeout });

            // --- Human-like Behavior ---
            try {
                const cursor = createCursor(page);
                // Random mouse movements
                await cursor.moveTo({ x: Math.random() * 300 + 50, y: Math.random() * 400 + 100 });
                await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
                // Scroll down slowly
                await page.evaluate(async () => {
                    await new Promise<void>((resolve) => {
                        let scrolled = 0;
                        const interval = setInterval(() => {
                            window.scrollBy(0, 80 + Math.random() * 40);
                            scrolled += 100;
                            if (scrolled >= document.body.scrollHeight * 0.6) {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 150 + Math.random() * 100);
                    });
                });
            } catch (e) {
                // Ignore cursor errors
            }

            // Wait a moment for any JS redirects
            await new Promise(r => setTimeout(r, 2000));

            // --- Ad Library Special Handling ---
            // If we are on the Ad Library page, try to click the CTA to get to the real URL
            if (page.url().includes('/ads/library')) {
                logger.info('🎯 Detected Ad Library page. Attempting to isolate and click CTA...');
                try {
                    // Wait for the ad preview to load
                    await page.waitForSelector('div[role="main"]', { timeout: 5000 }).catch(() => { });

                    // Finds the CTA button. Ad Library CTAs often have specific classes or text.
                    // We'll look for links that carry the user out of FB or specific CTA text.
                    const ctaClicked = await page.evaluate(async () => {
                        const keywords = ['Shop Now', 'Comprar agora', 'Learn More', 'Saiba mais', 'Sign Up', 'Cadastre-se', 'Get Offer', 'Obter oferta', 'Apply Now', 'Book Now'];

                        // Strategy 1: Look for button/link with CTA text
                        const elements = Array.from(document.querySelectorAll('a, div[role="button"], span[role="button"]'));
                        const cta = elements.find(el => {
                            const text = el.textContent?.trim() || '';
                            return keywords.some(k => text.includes(k));
                        });

                        if (cta) {
                            (cta as HTMLElement).click();
                            return true;
                        }

                        // Strategy 2: Look for the first external link in the main ad container
                        const links = Array.from(document.querySelectorAll('a'));
                        const external = links.find(a =>
                            a.href &&
                            !a.href.includes('facebook.com') &&
                            !a.href.includes('instagram.com') &&
                            !a.href.startsWith('/') &&
                            !a.href.includes('policy')
                        );

                        if (external) {
                            external.click();
                            return true;
                        }

                        return false;
                    });

                    if (ctaClicked) {
                        logger.info('🖱️ CTA clicked! Waiting for navigation...');
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                    } else {
                        logger.warn('⚠️ No obvious CTA found on Ad Library page.');
                    }
                } catch (err) {
                    logger.error('Error attempting to click Ad Library CTA', err);
                }
            }

            // If headful, wait for manual interaction
            if (opts.headful) {
                logger.info('⏳ Headful mode: waiting 30s for manual bypass...');
                await new Promise(r => setTimeout(r, 30000));
                try {
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => { });
                } catch (e) { /* ignore */ }
            }

            // --- Capture Results ---
            const finalUrl = page.url();
            const pageTitle = await page.title();
            const screenshotBuffer = await page.screenshot({ fullPage: true, encoding: 'base64' }) as string;

            // --- Page Analysis ---
            const pageAnalysis = await page.evaluate(() => {
                const body = document.body;
                const html = body?.innerHTML || '';

                // Detect money page signals
                const hasVideo = !!(
                    document.querySelector('video') ||
                    document.querySelector('iframe[src*="youtube"]') ||
                    document.querySelector('iframe[src*="vimeo"]') ||
                    document.querySelector('iframe[src*="vturb"]') ||
                    document.querySelector('iframe[src*="convertai"]') ||
                    document.querySelector('[class*="player"]') ||
                    html.match(/smartplayer|vturb|wistia|vidyard/i)
                );

                const hasForms = !!(
                    document.querySelector('form') ||
                    document.querySelector('input[type="email"]') ||
                    document.querySelector('input[type="tel"]')
                );

                const hasCheckout = !!(
                    html.match(/checkout|comprar|buy\s*now|adicionar.*carrinho|add.*cart/i) ||
                    document.querySelector('[class*="checkout"]') ||
                    document.querySelector('[class*="buy"]')
                );

                const hasCTA = !!(
                    html.match(/quero\s*(agora|já|comprar|garantir)|compre\s*agora|buy\s*now|get\s*(started|access|it)|claim.*offer/i) ||
                    document.querySelector('[class*="cta"]') ||
                    document.querySelector('button')
                );

                const hasCountdown = !!(
                    html.match(/countdown|timer|cronômetro|tempo.*rest/i) ||
                    document.querySelector('[class*="countdown"]') ||
                    document.querySelector('[class*="timer"]')
                );

                const hasSocialProof = !!(
                    html.match(/depoiment|testimonial|reviews?|avaliações|estrelas|⭐|★/i)
                );

                // Links and iframes
                const links = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(Boolean);
                const iframes = Array.from(document.querySelectorAll('iframe')).map(i => i.src).filter(Boolean);

                return {
                    htmlLength: html.length,
                    hasVideo,
                    hasForms,
                    hasCheckout,
                    hasCTA,
                    hasCountdown,
                    hasSocialProof,
                    linkCount: links.length,
                    iframeCount: iframes.length,
                    iframes,
                    pageText: (document.body.textContent || '').substring(0, 500),
                };
            });

            // --- Parse URL Parameters ---
            const urlObj = new URL(finalUrl);
            const parameters: Record<string, string> = {};
            urlObj.searchParams.forEach((value, key) => {
                parameters[key] = value;
            });

            // --- TWR Detection ---
            const twrDetected = 'twrclid' in parameters || 'tok' in parameters;

            // --- Cloaking Analysis ---
            const signals: string[] = [];
            let confidence = 0;

            // Check if we got redirected
            if (finalUrl !== url) {
                signals.push(`Redirected: ${url} → ${finalUrl}`);
                confidence += 10;
            }

            if (twrDetected) {
                signals.push('TWR parameters detected (twrclid/tok)');
                confidence += 30;
            }

            if (pageAnalysis.hasVideo) {
                signals.push('Video player detected (VSL)');
                confidence += 15;
            }

            if (pageAnalysis.hasCheckout) {
                signals.push('Checkout/Buy elements detected');
                confidence += 15;
            }

            if (pageAnalysis.hasCTA) {
                signals.push('Call-to-action buttons detected');
                confidence += 10;
            }

            if (pageAnalysis.hasCountdown) {
                signals.push('Countdown/urgency timer detected');
                confidence += 10;
            }

            if (pageAnalysis.hasSocialProof) {
                signals.push('Social proof/testimonials detected');
                confidence += 10;
            }

            // White page signals
            if (pageAnalysis.htmlLength < 5000) {
                signals.push('Very short page content (possible white page)');
                confidence -= 20;
            }

            if (pageAnalysis.linkCount === 0 && pageAnalysis.iframeCount === 0) {
                signals.push('No links or iframes (possible empty/white page)');
                confidence -= 15;
            }

            confidence = Math.max(0, Math.min(100, confidence));

            // Determine page type
            let pageType: 'money_page' | 'white_page' | 'unknown' = 'unknown';
            const moneySignals = [pageAnalysis.hasVideo, pageAnalysis.hasCheckout, pageAnalysis.hasCTA, pageAnalysis.hasCountdown].filter(Boolean).length;

            if (moneySignals >= 2 || (pageAnalysis.hasVideo && pageAnalysis.hasCTA)) {
                pageType = 'money_page';
            } else if (pageAnalysis.htmlLength < 5000 && moneySignals === 0) {
                pageType = 'white_page';
            }

            const analysis: CloakAnalysis = {
                isCloaked: twrDetected || redirectChain.length > 2,
                confidence,
                signals,
                pageType,
                detectedElements: {
                    hasVideo: pageAnalysis.hasVideo,
                    hasForms: pageAnalysis.hasForms,
                    hasCheckout: pageAnalysis.hasCheckout,
                    hasCTA: pageAnalysis.hasCTA,
                    hasCountdown: pageAnalysis.hasCountdown,
                    hasSocialProof: pageAnalysis.hasSocialProof,
                },
                twrDetected,
                parameters,
            };

            logger.info(`✅ Uncloak complete: ${pageType} (confidence: ${confidence}%)`);
            logger.info(`  Final URL: ${finalUrl}`);
            logger.info(`  Redirects: ${redirectChain.length}`);
            logger.info(`  TWR: ${twrDetected}`);

            return {
                originalUrl: url,
                finalUrl,
                redirectChain,
                pageTitle,
                screenshotBase64: screenshotBuffer,
                htmlLength: pageAnalysis.htmlLength,
                analysis,
                proxyUsed,
                timestamp: new Date().toISOString(),
            };

        } finally {
            await browser.close();
        }
    }
}

export const uncloakService = new UncloakService();
