import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { COMPANY_CONFIG } from '../config/company-config';

// ========== INTERFACES ==========

/** Single line item in the invoice — one per HAWB shipment */
interface InvoiceLineItem {
    slNo: number;
    date: string;
    hawbNo: string;
    shipper: string;
    origin: string;
    consignee: string;
    destination: string;
    by: string;         // Transport mode: AIR, SFC, TRN, etc.
    invNo?: string;
    hsnCode?: string;   // Default: 996511
    vanCode?: string;
    chg?: string;
    qty: number;
    weight: number;
    rate: number;
    doc?: number;       // Docket charge
    amount: number;
}

/** Full invoice data for multi-HAWB invoices (matches sample image) */
interface InvoiceData {
    invoice_number: string;
    invoice_date: string;
    due_date: string;

    // Customer details
    billed_to: {
        name: string;
        address: string;
        city: string;
        state: string;
        postal_code: string;
        gst_number?: string;
        pan_number?: string;
        phone?: string;
        email?: string;
    };

    // For single-HAWB invoices (backward compat)
    shipment?: {
        hawb: string;
        origin: string;
        destination: string;
        service_type: string;
        mode: string;
    };
    hawb?: string;

    // NEW: Multi-HAWB line items (from sample image)
    lineItems?: InvoiceLineItem[];

    // Legacy single-item charges (backward compat)
    charges?: Array<{
        description: string;
        hsn_code: string;
        quantity: number;
        unit_price: number;
        amount: number;
    }>;

    // Totals
    description?: string;
    hsn_code?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
    subtotal: number;
    tax_amount: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
    total_amount: number;
    payment_terms: string;
    payment_status: string;
    other_reference?: string;
}

// ========== HELPERS ==========

/** Convert number to Indian Rupee words */
function numberToWords(num: number): string {
    if (num === 0) return 'ZERO';
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
        'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    const convert = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = convert(rupees);
    if (paise > 0) result += ' AND ' + convert(paise) + ' PAISE';
    return result;
}

// ========== PDF GENERATOR ==========

/**
 * Generate Invoice PDF matching Sri Caargo sample format.
 * Supports both single-HAWB and multi-HAWB (lineItems) modes.
 */
export async function generateInvoicePDF(data: InvoiceData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const doc = new PDFDocument({ size: 'A4', margin: 25 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const pageW = doc.page.width;
            const leftM = 25;
            const rightM = pageW - 25;
            const contentW = rightM - leftM;

            // ==================== HEADER ====================
            // INVOICE title bar
            doc.rect(leftM, 20, contentW, 22).fillAndStroke('#8B1538', '#8B1538');
            doc.fillColor('#FFF').fontSize(14).font('Helvetica-Bold')
                .text('INVOICE', 0, 24, { width: pageW, align: 'center' });

            // Company logo
            doc.fontSize(26).fillColor('#8B1538').font('Helvetica-Bold')
                .text('SRI', leftM + 10, 55);
            doc.fontSize(26).text('CAARGO', leftM + 57, 55);

            // Company details (right)
            const addrX = 320;
            doc.fontSize(8).fillColor('#000').font('Helvetica-Bold')
                .text(`No.17/9,KOVALAN MUTHU STREET`, addrX, 50)
                .text('PERIAMET', addrX, 60)
                .text(`${COMPANY_CONFIG.address.city} - ${COMPANY_CONFIG.address.pincode}`, addrX, 70)
                .text(`Telephone Number - 044-48599573`, addrX, 80)
                .text(`Email Id- ${COMPANY_CONFIG.email}`, addrX, 90)
                .text(`Whats app No - ${COMPANY_CONFIG.phone}`, addrX, 100)
                .text(`GST NO - ${COMPANY_CONFIG.gstin}`, addrX, 110);

            // ==================== CUSTOMER BLOCK ====================
            const custTop = 128;

            // Customer name & address (left)
            doc.rect(leftM, custTop, 295, 52).stroke('#000');
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
                .text('CUSTOMER NAME', leftM + 5, custTop + 3);
            doc.fontSize(8).font('Helvetica')
                .text(`M/s. ${data.billed_to.name}`, leftM + 5, custTop + 14)
                .text(data.billed_to.address || '', leftM + 5, custTop + 26, { width: 280 })
                .text(`${data.billed_to.city || ''} ${data.billed_to.state || ''} ${data.billed_to.postal_code || ''}`, leftM + 5, custTop + 38, { width: 280 });

            // Invoice details (right)
            const detX = 320;
            const detW = contentW - 295;
            const detLabels = [
                { label: 'DATE', value: data.invoice_date },
                { label: 'INVOICE NO', value: data.invoice_number },
                { label: 'GSTIN NO', value: data.billed_to.gst_number || '' },
                { label: 'PAN NO', value: data.billed_to.pan_number || '' },
                { label: 'OTHER REFERENCE', value: data.other_reference || '' },
            ];
            detLabels.forEach((d, i) => {
                const ry = custTop + (i * 10.4);
                doc.rect(detX, ry, detW, 10.4).stroke('#000');
                doc.fontSize(6.5).font('Helvetica-Bold')
                    .text(d.label, detX + 3, ry + 2.5);
                doc.font('Helvetica')
                    .text(`: ${d.value}`, detX + 78, ry + 2.5);
            });

            // ==================== LINE ITEMS TABLE ====================
            const hasMultiItems = data.lineItems && data.lineItems.length > 0;

            if (hasMultiItems) {
                // ---- MULTI-HAWB TABLE (matches sample image exactly) ----
                const tableTop = custTop + 57;

                const cols = [
                    { label: 'SL\nNo', w: 18 },
                    { label: 'DATE', w: 52 },
                    { label: 'HAWB\nNo', w: 33 },
                    { label: 'SHIPPER', w: 60 },
                    { label: 'ORIGIN', w: 48 },
                    { label: 'CONSIGNEE', w: 60 },
                    { label: 'DEST', w: 28 },
                    { label: 'BY', w: 22 },
                    { label: 'INV\nNO', w: 28 },
                    { label: 'HSN\nCODE', w: 28 },
                    { label: 'VAN\nCODE', w: 17 },
                    { label: 'CHG', w: 14 },
                    { label: 'QTY', w: 16 },
                    { label: 'WGT', w: 25 },
                    { label: 'RATE', w: 30 },
                    { label: 'DOC', w: 24 },
                    { label: 'Amount', w: 42 },
                ];

                // Calculate x positions
                let cx = leftM;
                const colPositions = cols.map(c => {
                    const pos = { ...c, x: cx };
                    cx += c.w;
                    return pos;
                });

                // Header row
                doc.rect(leftM, tableTop, contentW, 20).fillAndStroke('#F0F0F0', '#000');
                doc.fillColor('#000').fontSize(5).font('Helvetica-Bold');
                colPositions.forEach(c => {
                    doc.text(c.label, c.x + 1, tableTop + 3, { width: c.w - 2, align: 'center' });
                });

                // Column separator lines
                colPositions.forEach(c => {
                    doc.moveTo(c.x, tableTop).lineTo(c.x, tableTop + 20).stroke('#000');
                });
                doc.moveTo(rightM, tableTop).lineTo(rightM, tableTop + 20).stroke('#000');

                // Data rows
                const rowH = 26;
                let y = tableTop + 20;
                doc.fontSize(5).font('Helvetica');

                data.lineItems!.forEach((item) => {
                    if (y + rowH > doc.page.height - 170) {
                        doc.addPage();
                        y = 30;
                    }

                    doc.rect(leftM, y, contentW, rowH).stroke('#000');
                    colPositions.forEach(c => {
                        doc.moveTo(c.x, y).lineTo(c.x, y + rowH).stroke('#000');
                    });
                    doc.moveTo(rightM, y).lineTo(rightM, y + rowH).stroke('#000');

                    const cy = y + 7;
                    doc.fillColor('#000')
                        .text(item.slNo.toString(), colPositions[0].x + 1, cy, { width: colPositions[0].w - 2, align: 'center' })
                        .text(item.date, colPositions[1].x + 2, cy, { width: colPositions[1].w - 4 })
                        .text(item.hawbNo, colPositions[2].x + 1, cy, { width: colPositions[2].w - 2, align: 'center' })
                        .text(item.shipper, colPositions[3].x + 2, cy - 3, { width: colPositions[3].w - 4 })
                        .text(item.origin, colPositions[4].x + 2, cy, { width: colPositions[4].w - 4 })
                        .text(item.consignee, colPositions[5].x + 2, cy - 3, { width: colPositions[5].w - 4 })
                        .text(item.destination, colPositions[6].x + 1, cy, { width: colPositions[6].w - 2, align: 'center' })
                        .text(item.by || '', colPositions[7].x + 1, cy, { width: colPositions[7].w - 2, align: 'center' })
                        .text(item.invNo || '', colPositions[8].x + 1, cy, { width: colPositions[8].w - 2, align: 'center' })
                        .text(item.hsnCode || '996511', colPositions[9].x + 1, cy, { width: colPositions[9].w - 2, align: 'center' })
                        .text(item.vanCode || '0', colPositions[10].x + 1, cy, { width: colPositions[10].w - 2, align: 'center' })
                        .text(item.chg || '', colPositions[11].x + 1, cy, { width: colPositions[11].w - 2, align: 'center' })
                        .text(item.qty.toString(), colPositions[12].x + 1, cy, { width: colPositions[12].w - 2, align: 'center' })
                        .text(item.weight.toFixed(1), colPositions[13].x + 1, cy, { width: colPositions[13].w - 2, align: 'right' })
                        .text(item.rate.toFixed(2), colPositions[14].x + 1, cy, { width: colPositions[14].w - 2, align: 'right' })
                        .text(item.doc?.toFixed(1) || '', colPositions[15].x + 1, cy, { width: colPositions[15].w - 2, align: 'right' })
                        .text(item.amount.toFixed(2), colPositions[16].x + 1, cy, { width: colPositions[16].w - 2, align: 'right' });

                    y += rowH;
                });

                // Fill empty rows to minimum 12
                const minRows = 12;
                const remaining = Math.max(0, minRows - data.lineItems!.length);
                for (let i = 0; i < remaining && y + rowH < doc.page.height - 170; i++) {
                    doc.rect(leftM, y, contentW, rowH).stroke('#000');
                    colPositions.forEach(c => {
                        doc.moveTo(c.x, y).lineTo(c.x, y + rowH).stroke('#000');
                    });
                    doc.moveTo(rightM, y).lineTo(rightM, y + rowH).stroke('#000');
                    y += rowH;
                }

                // ---- TOTALS ----
                const totalsTop = y + 8;

                // Rupees in Words (left)
                doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
                    .text('RUPEES IN WORDS :-', leftM, totalsTop + 3);
                doc.fontSize(7).font('Helvetica')
                    .text(numberToWords(data.total_amount), leftM, totalsTop + 15, { width: 300 });

                // Totals table (right)
                const netTotal = data.subtotal;
                const sgstAmt = data.sgst || 0;
                const cgstAmt = data.cgst || 0;
                const igstAmt = data.igst || (data.tax_amount || 0);
                const grandTotal = data.total_amount;

                const totX = 380;
                const totW = rightM - totX;
                const totRows = [
                    { label: 'NET TOTAL', value: netTotal.toFixed(2) },
                    { label: 'SGST 9%', value: sgstAmt.toFixed(1) },
                    { label: 'CGST 9%', value: cgstAmt.toFixed(1) },
                    { label: 'IGST 18%', value: igstAmt.toFixed(1) },
                    { label: 'GRAND TOTAL', value: grandTotal.toFixed(2) },
                ];

                totRows.forEach((row, i) => {
                    const ry = totalsTop + (i * 14);
                    doc.rect(totX, ry, 100, 14).stroke('#000');
                    doc.rect(totX + 100, ry, totW - 100, 14).stroke('#000');
                    doc.fontSize(7).font(i === 4 ? 'Helvetica-Bold' : 'Helvetica')
                        .text(row.label, totX + 3, ry + 3)
                        .text(row.value, totX + 103, ry + 3, { width: totW - 108, align: 'right' });
                });

                // ---- FOOTER ----
                const footerTop = totalsTop + 78;

                // Terms & Conditions (left)
                doc.fontSize(7).font('Helvetica-Bold')
                    .text('TERMS & CONDITION :-', leftM, footerTop + 3);
                doc.fontSize(6).font('Helvetica');
                const terms = [
                    'DELIVERY PERIODS - THE DELIVERY PERIODS MAY VARY FROM 1 - 3 DAYS',
                    `PAYMENT MADE BY CHEQUE SHOULD BE IN FAVOUR OF - ${COMPANY_CONFIG.name}`,
                    `BANK DETAILS - HDFC BANK RTGS/IFSC CODE - ${COMPANY_CONFIG.bank.ifsc || 'HDFC0001073'}`,
                    `OUR ACCOUNT NUMBER - ${COMPANY_CONFIG.bank.accountNumber || '50200030986816'}.`,
                ];
                terms.forEach((t, i) => {
                    doc.text(`${i + 1}. ${t}`, leftM, footerTop + 15 + (i * 9), { width: 330 });
                });

                // Authorized signatory (right)
                doc.fontSize(8).font('Helvetica-Bold')
                    .text(`For ${COMPANY_CONFIG.name}`, totX, footerTop + 3);
                doc.fontSize(8).text('AUTHORISED SIGNATORY', totX, footerTop + 40);

                // Page number
                doc.fontSize(8).font('Helvetica')
                    .text('Page No. 1', 0, doc.page.height - 30, { width: pageW, align: 'center' });
            } else {
                // ---- LEGACY SINGLE-HAWB FORMAT ----
                const tableTop = custTop + 57;

                // Shipment info
                if (data.shipment) {
                    doc.fontSize(8).font('Helvetica-Bold').text('SHIPMENT: ', leftM + 5, tableTop + 3);
                    doc.font('Helvetica').text(`${data.shipment.hawb} | ${data.shipment.origin} → ${data.shipment.destination} | ${data.shipment.service_type}`, leftM + 75, tableTop + 3);
                }

                // Simple charges table
                const tTop = tableTop + 20;
                doc.rect(leftM, tTop, contentW, 22).fillAndStroke('#8B1538', '#8B1538');
                doc.fillColor('#FFF').fontSize(9).font('Helvetica-Bold');
                doc.text('DESCRIPTION', leftM + 5, tTop + 6);
                doc.text('HSN', 280, tTop + 6, { width: 60, align: 'center' });
                doc.text('QTY', 340, tTop + 6, { width: 40, align: 'center' });
                doc.text('RATE', 380, tTop + 6, { width: 70, align: 'right' });
                doc.text('AMOUNT', rightM - 85, tTop + 6, { width: 80, align: 'right' });

                let rowY = tTop + 27;
                doc.fillColor('#000').font('Helvetica').fontSize(9);

                (data.charges || []).forEach((charge, i) => {
                    if (i % 2 === 0) doc.rect(leftM, rowY - 5, contentW, 20).fillAndStroke('#f9f9f9', '#e0e0e0');
                    else doc.rect(leftM, rowY - 5, contentW, 20).stroke('#e0e0e0');
                    doc.fillColor('#000');
                    doc.text(charge.description, leftM + 5, rowY, { width: 230 });
                    doc.text(charge.hsn_code, 280, rowY, { width: 60, align: 'center' });
                    doc.text(charge.quantity.toString(), 340, rowY, { width: 40, align: 'center' });
                    doc.text(`₹${charge.unit_price.toFixed(2)}`, 380, rowY, { width: 70, align: 'right' });
                    doc.text(`₹${charge.amount.toFixed(2)}`, rightM - 85, rowY, { width: 80, align: 'right' });
                    rowY += 20;
                });

                // Totals
                rowY += 10;
                doc.rect(350, rowY, 205, 20).stroke('#8B1538');
                doc.font('Helvetica-Bold').text('Subtotal:', 355, rowY + 6);
                doc.font('Helvetica').text(`₹${data.subtotal.toFixed(2)}`, rightM - 85, rowY + 6, { width: 80, align: 'right' });

                rowY += 20;
                doc.rect(350, rowY, 205, 20).stroke('#8B1538');
                doc.font('Helvetica-Bold').text('Tax:', 355, rowY + 6);
                doc.font('Helvetica').text(`₹${data.tax_amount.toFixed(2)}`, rightM - 85, rowY + 6, { width: 80, align: 'right' });

                rowY += 20;
                doc.rect(350, rowY, 205, 25).fillAndStroke('#8B1538', '#8B1538');
                doc.fillColor('#FFF').fontSize(11).font('Helvetica-Bold')
                    .text('TOTAL:', 355, rowY + 7);
                doc.fontSize(12).text(`₹${data.total_amount.toFixed(2)}`, rightM - 85, rowY + 7, { width: 80, align: 'right' });

                // Terms, signature, footer
                rowY += 40;
                doc.fillColor('#000').fontSize(8).font('Helvetica-Bold')
                    .text('TERMS & CONDITION :-', leftM, rowY);
                doc.fontSize(6.5).font('Helvetica');
                COMPANY_CONFIG.terms.slice(0, 4).forEach((term: string, i: number) => {
                    doc.text(`${i + 1}. ${term}`, leftM, rowY + 12 + (i * 10), { width: 330 });
                });

                doc.fontSize(8).font('Helvetica-Bold')
                    .text(`For ${COMPANY_CONFIG.name}`, 400, rowY)
                    .text('AUTHORISED SIGNATORY', 400, rowY + 40);

                doc.fontSize(8).font('Helvetica')
                    .text('Page No. 1', 0, doc.page.height - 30, { width: pageW, align: 'center' });
            }

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}
