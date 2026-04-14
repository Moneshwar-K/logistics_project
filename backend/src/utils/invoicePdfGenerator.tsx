import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from './pdfTemplates';
import fs from 'fs';

export const generateInvoicePDF = async (invoice: any, shipment: any, outputPath: string) => {
    try {
        const stream = await renderToStream(<InvoicePDF invoice={invoice} shipment={shipment} />);
        const writeStream = fs.createWriteStream(outputPath);
        stream.pipe(writeStream);

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(outputPath));
            writeStream.on('error', reject);
        });
    } catch (error) {
        throw error;
    }
};
