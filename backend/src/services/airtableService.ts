import Airtable from 'airtable';
import { logger } from '../utils/logger.js';

export class AirtableService {
    private base: Airtable.Base;
    private table: Airtable.Table<any>;

    constructor() {
        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const tableName = process.env.AIRTABLE_TABLE_NAME;

        if (!apiKey || !baseId || !tableName) {
            logger.error('Missing Airtable configuration. Please check .env file.');
            throw new Error('Missing Airtable configuration');
        }

        Airtable.configure({
            apiKey: apiKey,
            endpointUrl: 'https://api.airtable.com',
        });

        this.base = Airtable.base(baseId);
        this.table = this.base(tableName);
    }

    /**
     * Creates a new record in the Airtable base
     * @param fields Key-value pairs matching the table columns
     */
    async createRecord(fields: Record<string, any>): Promise<string> {
        try {
            const records = await this.table.create([{ fields }]);
            const recordId = records[0].id;
            logger.info(`Created Airtable record: ${recordId}`);
            return recordId;
        } catch (error) {
            logger.error('Error creating Airtable record:', error);
            throw error;
        }
    }

    /**
     * Retrieves the most recent records
     * @param limit Number of records to retrieve (default: 10)
     */
    async getRecentRecords(limit: number = 10): Promise<any[]> {
        try {
            const records = await this.table.select({
                maxRecords: limit,
                sort: [{ field: 'Created', direction: 'desc' }] // Assuming 'Created' field exists, otherwise remove sort
            }).firstPage();

            return records.map(record => ({
                id: record.id,
                fields: record.fields
            }));
        } catch (error) {
            // If sort field doesn't exist, try without sort
            try {
                const records = await this.table.select({
                    maxRecords: limit
                }).firstPage();
                return records.map(record => ({
                    id: record.id,
                    fields: record.fields
                }));
            } catch (retryError) {
                logger.error('Error fetching Airtable records:', retryError);
                throw retryError;
            }
        }
    }

    /**
     * Checks if the connection to Airtable is valid by fetching 1 record
     */
    async checkConnection(): Promise<boolean> {
        try {
            await this.table.select({ maxRecords: 1 }).firstPage();
            logger.info('✅ Airtable connection established successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to connect to Airtable:', error);
            return false;
        }
    }
}

export const airtableService = new AirtableService();
