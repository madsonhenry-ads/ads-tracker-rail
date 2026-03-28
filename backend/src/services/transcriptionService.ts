import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { OpenAI } from 'openai';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from '../utils/logger.js';

// @ts-ignore
puppeteer.use(StealthPlugin());

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class TranscriptionService {
    /**
     * Finds the direct .mp4 video URL from a Facebook Ad Library snapshot page
     */
    private async findDirectVideoUrl(snapshotUrl: string): Promise<string | null> {
        logger.info(`🔍 Hunting for direct video URL on: ${snapshotUrl}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            
            // Go to snapshot page
            await page.goto(snapshotUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000)); // Short wait for JS players

            // Look for <video> tag
            const videoUrl = await page.evaluate(() => {
                const videoEl = document.querySelector('video');
                return videoEl ? videoEl.src : null;
            });

            return videoUrl;
        } catch (error) {
            logger.error(`❌ Failed to extract video URL: ${error}`);
            return null;
        } finally {
            await browser.close();
        }
    }

    /**
     * Transcribes audio from a video URL using OpenAI Whisper
     */
    async transcribeAudio(url: string): Promise<string> {
        let tempFilePath: string | null = null;
        let directVideoUrl = url;
        
        try {
            // 1. If it's a snapshot URL, extract the direct mp4 link first
            if (url.includes('facebook.com/ads/library')) {
                const extractedUrl = await this.findDirectVideoUrl(url);
                if (!extractedUrl) {
                    throw new Error('Não foi possível localizar o vídeo neste anúncio.');
                }
                directVideoUrl = extractedUrl;
            }

            logger.info(`🎙️ Starting transcription for direct video: ${directVideoUrl}`);
            
            // 2. Create a unique temp file path
            const tempDir = os.tmpdir();
            const fileName = `ad_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
            tempFilePath = path.join(tempDir, fileName);

            // 3. Download the video file
            logger.info('📥 Downloading video for transcription...');
            const response = await axios({
                method: 'get',
                url: directVideoUrl,
                responseType: 'stream',
                timeout: 30000,
            });

            const writer = fs.createWriteStream(tempFilePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 4. Send to OpenAI Whisper
            logger.info('🧠 Sending to OpenAI Whisper API...');
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                language: 'pt',
            });

            logger.info('✅ Transcription completed successfully');
            return transcription.text;

        } catch (error: any) {
            logger.error(`❌ Transcription failed: ${error.message}`);
            throw error;
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                    logger.info('🧹 Temp audio file cleaned up');
                } catch (e) {}
            }
        }
    }
}

export const transcriptionService = new TranscriptionService();
export default transcriptionService;
