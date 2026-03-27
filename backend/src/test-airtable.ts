import { airtableService } from './services/airtableService.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAirtable() {
    console.log('Testing Airtable Connection...');
    try {
        const isConnected = await airtableService.checkConnection();
        if (isConnected) {
            console.log('✅ Connection Sucessful!');

            console.log('Fetching recent records...');
            const records = await airtableService.getRecentRecords(5);
            console.log(`Found ${records.length} records.`);
            console.log(JSON.stringify(records, null, 2));

        } else {
            console.error('❌ Connection Failed.');
            process.exit(1);
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        process.exit(1);
    }
}

testAirtable();
