import { createError } from '../middleware/errorHandler';
import { POD, IPOD, PODUpload, IPODUpload, Shipment } from '../models';
import { shipmentService } from './shipmentService';
import { trackingService } from './trackingService';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { generatePODPDF } from '../utils/pdfGenerator';
import { sendEmail, emailTemplates } from '../utils/emailService';
import { COMPANY_CONFIG } from '../config/company-config';

export const podService = {
  async createPOD(
    podData: {
      shipment_id: string;
      receiver_name: string;
      receiver_contact: string;
      receiver_address: string;
      delivery_date: string;
      delivery_time: string;
      acceptance_checklist: {
        package_intact: boolean;
        seals_intact: boolean;
        no_damage: boolean;
        weight_verified: boolean;
        cartons_verified: boolean;
      };
      signature_url: string;
      company_stamp_url?: string;
      remarks?: string;
    },
    createdById: string,
    branchId: string
  ): Promise<IPOD> {
    // Verify shipment exists
    const shipment = await Shipment.findById(podData.shipment_id)
      .populate('sh ipper_id')
      .populate('consignee_id')
      .lean();

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Check if POD already exists
    const existingPOD = await POD.findOne({ shipment_id: podData.shipment_id });
    if (existingPOD) {
      throw createError('POD already exists for this shipment', 400);
    }

    // Create POD
    const pod = await POD.create({
      shipment_id: new mongoose.Types.ObjectId(podData.shipment_id),
      receiver_name: podData.receiver_name,
      receiver_contact: podData.receiver_contact,
      receiver_address: podData.receiver_address,
      delivery_date: new Date(podData.delivery_date),
      delivery_time: podData.delivery_time,
      acceptance_checklist: podData.acceptance_checklist,
      signature_url: podData.signature_url,
      company_stamp_url: podData.company_stamp_url || undefined,
      remarks: podData.remarks || undefined,
      created_by_id: new mongoose.Types.ObjectId(createdById),
      branch_id: new mongoose.Types.ObjectId(branchId),
    });

    // Generate POD PDF
    const podPDFPath = path.join(
      process.env.UPLOAD_DIR || './uploads',
      'pods',
      podData.shipment_id,
      `POD_${shipment.hawb}.pdf`
    );

    const pdfData = {
      shipmentId: podData.shipment_id,
      hawb: shipment.hawb as string,
      bookingDate: new Date(shipment.created_at as Date).toLocaleDateString(),
      // Use company contact numbers for dispatch enquiry
      dispatchEnquiry: [
        COMPANY_CONFIG.phone.replace('+91 ', ''),
        COMPANY_CONFIG.alternatePhone.replace('+91 ', ''),
        COMPANY_CONFIG.customerCare.replace('+91 ', '')
      ],
      shipper: {
        name: (shipment.shipper_id as any)?.name || '',
        address: (shipment.shipper_id as any)?.address || '',
        city: (shipment.shipper_id as any)?.city || shipment.origin_city,
        contactPerson: '',
        email: (shipment.shipper_id as any)?.email || '',
        postalCode: (shipment.shipper_id as any)?.postal_code || '',
        gstNo: (shipment.shipper_id as any)?.gst_number || '',
      },
      consignee: {
        name: (shipment.consignee_id as any)?.name || '',
        address: (shipment.consignee_id as any)?.address || '',
        city: (shipment.consignee_id as any)?.city || shipment.destination_city,
        contactPerson: '',
        email: (shipment.consignee_id as any)?.email || '',
        postalCode: (shipment.consignee_id as any)?.postal_code || '',
        gstNo: (shipment.consignee_id as any)?.gst_number || '',
      },
      package: {
        noOfPacking: shipment.total_cartons,
        typeOfPacking: shipment.package_type || 'CARTON', // Dynamic from shipment
        weight: shipment.total_weight,
      },
      invoice: {
        no: shipment.reference_number || shipment.hawb,
        value: shipment.invoice_value,
        description: shipment.goods_description || shipment.shipment_type || '', // Dynamic from shipment
      },
      serviceMode: shipment.mode?.toUpperCase() || 'RAILWAYS',
      ewayBill: '',
      payment: {
        mode: 'CREDIT',
        amount: shipment.invoice_value,
        igst: 0,
        cgst: 0,
        sgst: 0,
        grandTotal: shipment.invoice_value,
      },
      receiverSeal: '',
      receiverSign: podData.signature_url,
      shipperSign: '',
    };

    try {
      await generatePODPDF(pdfData, podPDFPath);
    } catch (error) {
      console.error('Error generating POD PDF:', error);
      // Continue even if PDF generation fails
    }

    // Update shipment status to delivered
    await shipmentService.updateShipment(podData.shipment_id, {
      status: 'delivered',
      actual_delivery_date: podData.delivery_date,
    });

    // Create tracking event
    await trackingService.createTrackingEvent(
      podData.shipment_id,
      {
        status: 'delivered',
        location: podData.receiver_address,
        city: shipment.destination_city,
        country: shipment.destination_country,
        remarks: 'POD confirmed - Delivery completed',
        proof_of_delivery_url: podData.signature_url,
      },
      createdById
    );

    // Send delivery confirmation email with POD
    const shipperEmail = (shipment.shipper_id as any)?.email;
    if (shipperEmail && fs.existsSync(podPDFPath)) {
      sendEmail({
        to: shipperEmail,
        subject: `Shipment Delivered - ${shipment.hawb}`,
        html: emailTemplates.deliveryConfirmation({
          customerName: (shipment.shipper_id as any)?.name || 'Customer',
          hawb: shipment.hawb as string,
          deliveryDate: new Date(podData.delivery_date).toLocaleDateString(),
          receiverName: podData.receiver_name,
        }),
        attachments: [
          {
            filename: `POD_${shipment.hawb}.pdf`,
            path: podPDFPath,
          },
        ],
      }).catch(err => console.error('Error sending delivery email:', err));
    }

    return pod.toObject();
  },

  async getPOD(shipmentId: string): Promise<IPOD> {
    const pod = await POD.findOne({ shipment_id: shipmentId })
      .populate('created_by_id', 'name email')
      .lean();

    if (!pod) {
      throw createError('POD not found', 404);
    }

    return pod as unknown as IPOD;
  },

  async uploadPODFiles(
    shipmentId: string,
    files: { [fieldname: string]: Express.Multer.File[] },
    uploadedById: string
  ) {
    // Verify shipment exists
    await shipmentService.getShipmentById(shipmentId);

    const uploadData: any = {
      shipment_id: new mongoose.Types.ObjectId(shipmentId),
      uploaded_by_id: new mongoose.Types.ObjectId(uploadedById),
      status: 'pending',
    };

    // Handle file uploads
    if (files.pod_file && files.pod_file[0]) {
      uploadData.pod_file_url = `/uploads/pod_file/${files.pod_file[0].filename}`;
    }
    if (files.signature_file && files.signature_file[0]) {
      uploadData.signature_file_url = `/uploads/signature_file/${files.signature_file[0].filename}`;
    }
    if (files.kyc_front && files.kyc_front[0]) {
      uploadData.kyc_front_url = `/uploads/kyc_front/${files.kyc_front[0].filename}`;
    }
    if (files.kyc_back && files.kyc_back[0]) {
      uploadData.kyc_back_url = `/uploads/kyc_back/${files.kyc_back[0].filename}`;
    }

    const upload = await PODUpload.create(uploadData);
    return upload.toObject();
  },

  getPODFilePath(shipmentId: string): string {
    // This would return the file path for downloading POD
    const uploadsDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadsDir, 'pods', shipmentId, `POD_${shipmentId}.pdf`);
  },

  async listPODs(filters: any = {}, page: number = 1, limit: number = 50) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    const total = await POD.countDocuments(query);
    const offset = (page - 1) * limit;

    const data = await POD.find(query)
      .populate({
        path: 'shipment_id',
        select: 'hawb origin_city destination_city status',
        populate: [
          { path: 'shipper_id', select: 'name' },
          { path: 'consignee_id', select: 'name' },
        ],
      })
      .populate('created_by_id', 'name email')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  },
};
