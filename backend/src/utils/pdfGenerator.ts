import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { COMPANY_CONFIG } from '../config/company-config';

interface PODData {
    shipmentId: string;
    hawb: string;
    bookingDate: string;
    dispatchEnquiry: string[];
    shipper: {
        name: string;
        address: string;
        city: string;
        contactPerson?: string;
        email?: string;
        postalCode?: string;
        gstNo?: string;
    };
    consignee: {
        name: string;
        address: string;
        city: string;
        contactPerson?: string;
        email?: string;
        postalCode?: string;
        gstNo?: string;
    };
    package: {
        noOfPacking: number;
        typeOfPacking: string;
        weight: number;
    };
    invoice: {
        no: string;
        value: number;
        description: string;
    };
    serviceMode: string;
    ewayBill?: string;
    payment: {
        mode: string;
        amount?: number;
        igst?: number;
        cgst?: number;
        sgst?: number;
        grandTotal?: number;
    };
    receiverSeal?: string;
    receiverSign?: string;
    shipperSign?: string;
}

/**
 * Generate POD PDF matching Sri Caargo format
 */
export async function generatePODPDF(data: PODData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Ensure directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const doc = new PDFDocument({ size: 'A4', margin: 30 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header with company name and barcode
            doc.fontSize(24)
                .fillColor('#8B1538')
                .font('Helvetica-Bold')
                .text('SRI CAARGO', 30, 30);

            // Company address and details
            doc.fontSize(9).fillColor('#000')
                .font('Helvetica')
                .text(`${COMPANY_CONFIG.address.line1}, ${COMPANY_CONFIG.address.line2}`, 30, 60)
                .text(`${COMPANY_CONFIG.address.city} CH-${COMPANY_CONFIG.address.pincode.slice(-1)}`, 30, 72)
                .text(`GSTIN NO: ${COMPANY_CONFIG.gstin}`, 30, 84)
                .text(`Email: ${COMPANY_CONFIG.email}`, 30, 96);

            // Barcode (using HAWB number in text form - can be replaced with actual barcode library)
            doc.fontSize(12).font('Helvetica-Bold').text(data.hawb, 500, 40).fontSize(10);

            // Booking date and dispatch enquiry
            doc.fontSize(10).font('Helvetica')
                .text(`BOOKING DATE: ${data.bookingDate}`, 430, 80, { width: 140, align: 'right' })
                .text('DISPATCH ENQUIRY', 430, 95, { width: 140, align: 'right' });

            data.dispatchEnquiry.forEach((phone, i) => {
                doc.text(phone, 430, 110 + (i * 12), { width: 140, align: 'right' });
            });

            // Shipper and Consignee section
            const tableTop = 140;

            // Section headers
            doc.rect(30, tableTop, 265, 25).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(305, tableTop, 265, 25).fillAndStroke('#8B1538', '#8B1538');

            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text('SHIPPER NAME AND ADDRESS', 35, tableTop + 8)
                .text('CONSIGNEE NAME AND ADDRESS', 310, tableTop + 8);

            // Shipper details
            let yPos = tableTop + 35;
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(9)
                .text(data.shipper.name.toUpperCase(), 35, yPos);
            yPos += 12;
            doc.font('Helvetica').text(data.shipper.city.toUpperCase(), 35, yPos);

            // Contact details table for shipper
            if (data.shipper.contactPerson || data.shipper.email) {
                yPos += 20;
                doc.rect(30, yPos, 265, 40).stroke('#8B1538');
                doc.rect(30, yPos, 100, 20).stroke('#8B1538');
                doc.rect(130, yPos, 165, 20).stroke('#8B1538');
                doc.rect(30, yPos + 20, 100, 20).stroke('#8B1538');
                doc.rect(130, yPos + 20, 165, 20).stroke('#8B1538');

                doc.font('Helvetica-Bold').text('Contact Person', 35, yPos + 6);
                doc.font('Helvetica').text(data.shipper.contactPerson || '', 135, yPos + 6);
                doc.font('Helvetica-Bold').text('Email Id', 35, yPos + 26);
                doc.font('Helvetica').text(data.shipper.email || '', 135, yPos + 26);
            }

            // Consignee details
            yPos = tableTop + 35;
            doc.font('Helvetica-Bold').fontSize(9)
                .text(data.consignee.name.toUpperCase(), 310, yPos);
            yPos += 12;
            doc.font('Helvetica').text(data.consignee.city.toUpperCase(), 310, yPos);

            // Contact details table for consignee
            if (data.consignee.contactPerson || data.consignee.email) {
                yPos += 20;
                doc.rect(305, tableTop + 95, 265, 40).stroke('#8B1538');
                doc.rect(305, tableTop + 95, 100, 20).stroke('#8B1538');
                doc.rect(405, tableTop + 95, 165, 20).stroke('#8B1538');
                doc.rect(305, tableTop + 115, 100, 20).stroke('#8B1538');
                doc.rect(405, tableTop + 115, 165, 20).stroke('#8B1538');

                doc.font('Helvetica-Bold').text('Contact Person', 310, tableTop + 101);
                doc.font('Helvetica').text(data.consignee.contactPerson || '', 410, tableTop + 101);
                doc.font('Helvetica-Bold').text('Email Id', 310, tableTop + 121);
                doc.font('Helvetica').text(data.consignee.email || '', 410, tableTop + 121);
            }

            // Package details section
            let packageTop = tableTop + 150;

            // Headers
            doc.rect(30, packageTop, 80, 25).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(110, packageTop, 105, 25).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(215, packageTop, 80, 25).fillAndStroke('#8B1538', '#8B1538');

            doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(8)
                .text('NO OF PACKAGING', 32, packageTop + 8)
                .text('TYPE OF PACKAGING', 112, packageTop + 8)
                .text('WEIGHT', 217, packageTop + 8);

            // Package data
            doc.fillColor('#000').font('Helvetica').fontSize(10)
                .text(data.package.noOfPacking.toString(), 50, packageTop + 30)
                .text(data.package.typeOfPacking.toUpperCase(), 130, packageTop + 30)
                .text(data.package.weight.toString(), 235, packageTop + 30);

            // Invoice details
            doc.rect(295, packageTop, 80, 25).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(375, packageTop, 100, 25).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(475, packageTop, 95, 25).fillAndStroke('#8B1538', '#8B1538');

            doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(8)
                .text('INVOICE NO', 297, packageTop + 8)
                .text('INVOICE VALUE', 377, packageTop + 8)
                .text('DESCRIPTION OF GOODS', 477, packageTop + 3, { width: 90, align: 'center' });

            doc.fillColor('#000').font('Helvetica').fontSize(10)
                .text(data.invoice.no, 305, packageTop + 30)
                .text(data.invoice.value.toString(), 395, packageTop + 30)
                .text(data.invoice.description, 480, packageTop + 30, { width: 85 });

            // Service mode and E-way bill
            const serviceTop = packageTop + 70;
            doc.rect(30, serviceTop, 265, 60).stroke('#8B1538');
            doc.rect(305, serviceTop, 265, 60).stroke('#8B1538');

            doc.rect(30, serviceTop, 265, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(305, serviceTop, 265, 20).fillAndStroke('#8B1538', '#8B1538');

            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text('SERVICE MODE', 110, serviceTop + 6)
                .text('E-WAY BILL', 400, serviceTop + 6);

            doc.fillColor('#000').font('Helvetica').fontSize(14)
                .text(data.serviceMode.toUpperCase(), 120, serviceTop + 30)
                .text(data.ewayBill || '', 380, serviceTop + 30);

            // Receiver seal and sign
            const receiverTop = serviceTop + 80;
            doc.rect(30, receiverTop, 290, 80).stroke('#8B1538');
            doc.rect(320, receiverTop, 250, 80).stroke('#8B1538');

            doc.rect(30, receiverTop, 290, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.rect(320, receiverTop, 250, 20).fillAndStroke('#8B1538', '#8B1538');

            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text('RECEIVER SEAL', 130, receiverTop + 6)
                .text('RECEIVER SIGN', 410, receiverTop + 6);

            // Payment section
            const paymentTop = receiverTop + 100;
            doc.rect(30, paymentTop, 290, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text(`PAYMENT MODE - ${data.payment.mode.toUpperCase()}`, 100, paymentTop + 6);

            // Payment details
            const payDetailsTop = paymentTop + 25;
            ['AMOUNT', 'IGST@ %', 'CGST@ %', 'SGST@ %', 'GRAND TOTAL'].forEach((label, i) => {
                doc.rect(30, payDetailsTop + (i * 20), 140, 20).stroke('#8B1538');
                doc.rect(170, payDetailsTop + (i * 20), 150, 20).stroke('#8B1538');
                doc.fillColor('#000').font('Helvetica-Bold')
                    .text(label, 35, payDetailsTop + (i * 20) + 6);
            });

            // Remarks section
            doc.rect(320, paymentTop, 250, 125).stroke('#8B1538');
            doc.rect(320, paymentTop, 250, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text('REMARKS', 410, paymentTop + 6);

            // Shipper sign
            const shipperSignTop = paymentTop + 150;
            doc.rect(30, shipperSignTop, 540, 60).stroke('#8B1538');
            doc.rect(30, shipperSignTop, 540, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.fillColor('#FFF').font('Helvetica-Bold')
                .text('SHIPPER SIGN', 250, shipperSignTop + 6);

            // Terms and conditions
            const termsTop = shipperSignTop + 70;
            doc.rect(30, termsTop, 540, 100).fillAndStroke('#8B1538', '#8B1538');
            doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(10)
                .text('TERMS & CONDITIONS', 230, termsTop + 5);

            doc.fontSize(7).font('Helvetica').fillColor('#FFF');
            COMPANY_CONFIG.terms.forEach((term, i) => {
                doc.text(`${i + 1}. ${term}`, 35, termsTop + 20 + (i * 10), { width: 530 });
            });

            // Footer
            doc.fontSize(8).fillColor('#FFF')
                .text('Received goods as specific overleaf in good and sound condition.', 200, termsTop + 80)
                .text('Signature of the Consignee (Receiver).', 230, termsTop + 90);

            // Website footer
            doc.rect(30, doc.page.height - 50, 540, 20).fillAndStroke('#8B1538', '#8B1538');
            doc.fontSize(10).fillColor('#FFF').font('Helvetica-Bold')
                .text(`Website: ${COMPANY_CONFIG.website}`, 230, doc.page.height - 44);

            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}
