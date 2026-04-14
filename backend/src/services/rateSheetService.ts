import xlsx from 'xlsx';
import RateSheet, { IRateRow } from '../models/RateSheet';
import { logger } from '../utils/logger';

export const rateSheetService = {
    // Parse Excel file and store rates
    async processRateSheet(filePath: string, meta: { name: string; type: 'general' | 'client_specific'; client_id?: string; service_type: 'air' | 'surface' | 'train' | 'express' }) {
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            if (!data || data.length === 0) {
                throw new Error('Sheet is empty');
            }

            // Expected format: Min Weight | Max Weight | Zone A | Zone B | ...
            // Transform logic:
            const rows: IRateRow[] = [];
            const zones = Object.keys(data[0] as object).filter(k => k !== 'Min Weight' && k !== 'Max Weight' && k !== 'min_weight' && k !== 'max_weight');

            data.forEach((row: any) => {
                const minWeight = row['Min Weight'] || row['min_weight'];
                const maxWeight = row['Max Weight'] || row['max_weight'];

                if (minWeight === undefined || maxWeight === undefined) return;

                zones.forEach(zone => {
                    if (row[zone] !== undefined) {
                        rows.push({
                            min_weight: Number(minWeight),
                            max_weight: Number(maxWeight),
                            zone: zone,
                            rate: Number(row[zone])
                        });
                    }
                });
            });

            // Create RateSheet entry
            const rateSheet = new RateSheet({
                name: meta.name || `Rate Sheet - ${new Date().toISOString()}`,
                type: meta.type,
                client_id: meta.client_id,
                service_type: meta.service_type,
                valid_from: new Date(),
                rows: rows,
                status: 'active'
            });

            await rateSheet.save();
            logger.info(`Rate sheet processed: ${rateSheet._id} with ${rows.length} rates`);
            return rateSheet;

        } catch (error) {
            logger.error('Error processing rate sheet:', error);
            throw error;
        }
    }
};
