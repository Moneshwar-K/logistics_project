import { Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Charge } from '../models/Charge';
import { Shipment } from '../models/Shipment';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';
import { generatePODPDF } from '../utils/pdfGenerator';

export const pdfService = {

    /**
     * Generate and stream Invoice PDF (SRI CAARGO format)
     */
    async generateInvoicePDF(invoiceId: string, res: Response): Promise<void> {
        // Fetch invoice + related data
        const invoice = await Invoice.findById(invoiceId).populate('billed_party_id');
        if (!invoice) throw new Error('Invoice not found');

        const charges = await Charge.find({ invoice_id: invoiceId });
        const shipmentDoc = await Shipment.findById(invoice.shipment_id).populate('shipper_id consignee_id');
        const shipment = shipmentDoc as any;

        const billedParty = invoice.billed_party_id as any;
        const shipper = shipment?.shipper_id as any;
        const consignee = shipment?.consignee_id as any;

        const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-IN');

        // Build invoice data for the generator
        const invoiceData: any = {
            invoice_number: invoice.invoice_number,
            invoice_date: formatDate(invoice.invoice_date),
            due_date: formatDate(invoice.due_date),
            billed_to: {
                name: billedParty?.name || 'N/A',
                address: billedParty?.address || '',
                city: billedParty?.city || '',
                state: billedParty?.state || '',
                postal_code: billedParty?.postal_code || '',
                gst_number: billedParty?.gst_number || '',
                pan_number: billedParty?.pan_number || '',
                phone: billedParty?.phone || '',
                email: billedParty?.email || '',
            },
            subtotal: invoice.subtotal,
            tax_amount: invoice.tax_amount,
            igst: invoice.igst || 0,
            cgst: invoice.cgst || 0,
            sgst: invoice.sgst || 0,
            total_amount: invoice.total_amount,
            payment_terms: 'Net 30 Days',
            payment_status: invoice.payment_status,
        };

        // If we have charges, use as line items
        if (charges.length > 0) {
            invoiceData.charges = charges.map((c: any) => ({
                description: c.description,
                hsn_code: c.hsn_code || '996511',
                quantity: c.quantity,
                unit_price: c.unit_price,
                amount: c.amount,
            }));
        }

        // If shipment exists, add shipment info
        if (shipment) {
            invoiceData.shipment = {
                hawb: shipment.hawb,
                origin: shipment.origin_city,
                destination: shipment.destination_city,
                service_type: shipment.service_type || 'AIR',
                mode: shipment.transport_mode || 'AIR',
            };

            // Build multi-HAWB line item (single item for single shipment invoice)
            if (!invoiceData.lineItems) {
                invoiceData.lineItems = [{
                    slNo: 1,
                    date: formatDate(shipment.booking_date || invoice.invoice_date),
                    hawbNo: shipment.hawb,
                    shipper: shipper?.name || 'N/A',
                    origin: shipment.origin_city || '',
                    consignee: consignee?.name || 'N/A',
                    destination: shipment.destination_city || '',
                    by: (shipment.transport_mode || 'AIR').substring(0, 3).toUpperCase(),
                    invNo: '',
                    hsnCode: '996511',
                    vanCode: '0',
                    chg: '',
                    qty: shipment.total_cartons || 1,
                    weight: shipment.total_weight || 0,
                    rate: invoice.subtotal / (shipment.total_weight || 1),
                    doc: 0,
                    amount: invoice.subtotal,
                }];
            }
        }

        // Generate to temp file then stream
        const tmpFile = path.join(os.tmpdir(), `invoice-${invoiceId}-${Date.now()}.pdf`);
        try {
            await generateInvoicePDF(invoiceData, tmpFile);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoice_number}.pdf`);

            const stream = fs.createReadStream(tmpFile);
            stream.pipe(res);
            stream.on('end', () => { try { fs.unlinkSync(tmpFile); } catch (e) { } });
        } catch (err) {
            try { fs.unlinkSync(tmpFile); } catch (e) { }
            throw err;
        }
    },

    /**
     * Generate and stream POD PDF (SRI CAARGO format)
     */
    async generatePODPDF(shipmentId: string, res: Response): Promise<void> {
        const shipmentDoc = await Shipment.findById(shipmentId).populate('shipper_id consignee_id');
        if (!shipmentDoc) throw new Error('Shipment not found');
        const shipment = shipmentDoc as any;

        const shipper = shipment.shipper_id as any;
        const consignee = shipment.consignee_id as any;
        const invoice = await Invoice.findOne({ shipment_id: shipmentId });

        const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-IN');

        const podData = {
            shipmentId: shipment._id.toString(),
            hawb: shipment.hawb,
            bookingDate: formatDate(shipment.booking_date || new Date()),
            dispatchEnquiry: ['7338965037', '7338965039'],
            shipper: {
                name: shipper?.name || 'N/A',
                address: shipper?.address || '',
                city: shipment.origin_city || '',
                contactPerson: shipper?.contact_person || '',
                email: shipper?.email || '',
                gstNo: shipper?.gst_number || '',
            },
            consignee: {
                name: consignee?.name || 'N/A',
                address: consignee?.address || '',
                city: shipment.destination_city || '',
                contactPerson: consignee?.contact_person || '',
                email: consignee?.email || '',
                gstNo: consignee?.gst_number || '',
            },
            package: {
                noOfPacking: shipment.total_cartons || 1,
                typeOfPacking: 'CARTON',
                weight: shipment.total_weight || 0,
            },
            invoice: {
                no: invoice?.invoice_number || '',
                value: invoice?.total_amount || 0,
                description: shipment.description || 'GENERAL GOODS',
            },
            serviceMode: shipment.transport_mode || 'AIR',
            ewayBill: '',
            payment: {
                mode: 'CREDIT',
                amount: invoice?.subtotal || 0,
                igst: invoice?.igst || 0,
                cgst: invoice?.cgst || 0,
                sgst: invoice?.sgst || 0,
                grandTotal: invoice?.total_amount || 0,
            },
        };

        const tmpFile = path.join(os.tmpdir(), `pod-${shipmentId}-${Date.now()}.pdf`);
        try {
            await generatePODPDF(podData, tmpFile);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=POD-${shipment.hawb}.pdf`);

            const stream = fs.createReadStream(tmpFile);
            stream.pipe(res);
            stream.on('end', () => { try { fs.unlinkSync(tmpFile); } catch (e) { } });
        } catch (err) {
            try { fs.unlinkSync(tmpFile); } catch (e) { }
            throw err;
        }
    },
};
