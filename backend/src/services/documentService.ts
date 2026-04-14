import { createError } from '../middleware/errorHandler';
import { Document as DocumentModel, IDocument, DocumentType } from '../models';
import { Shipment } from '../models';
import { shipmentService } from './shipmentService';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

export const documentService = {
  async listAllDocuments(filters: any = {}, page: number = 1, limit: number = 50) {
    const query: any = {};

    if (filters.document_type && filters.document_type !== 'all') {
      query.document_type = filters.document_type;
    }
    if (filters.search) {
      query.file_name = { $regex: filters.search, $options: 'i' };
    }

    const total = await DocumentModel.countDocuments(query);
    const offset = (page - 1) * limit;

    const data = await DocumentModel.find(query)
      .populate({
        path: 'shipment_id',
        select: 'hawb',
      })
      .populate('uploaded_by_id', 'name email')
      .sort({ uploaded_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean<IDocument[]>();

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

  async getShipmentDocuments(shipmentId: string): Promise<IDocument[]> {
    // Verify shipment exists
    await shipmentService.getShipmentById(shipmentId);

    const documents = await DocumentModel.find({ shipment_id: shipmentId })
      .sort({ uploaded_at: -1 })
      .populate('uploaded_by_id', 'name email')
      .lean<IDocument[]>();

    return documents as IDocument[];
  },

  async uploadDocument(
    shipmentId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    uploadedById: string
  ): Promise<IDocument> {
    // Verify shipment exists
    await shipmentService.getShipmentById(shipmentId);

    // Create document record
    const document = await DocumentModel.create({
      shipment_id: new mongoose.Types.ObjectId(shipmentId),
      document_type: documentType,
      file_url: `/uploads/documents/${file.filename}`,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by_id: new mongoose.Types.ObjectId(uploadedById),
    });

    return document.toObject() as unknown as IDocument;
  },

  async getDocument(id: string): Promise<IDocument> {
    const document = await DocumentModel.findById(id)
      .populate('uploaded_by_id', 'name email')
      .lean<IDocument>();

    if (!document) {
      throw createError('Document not found', 404);
    }

    return document as IDocument;
  },

  async deleteDocument(id: string): Promise<void> {
    const document = await DocumentModel.findById(id);
    if (!document) {
      throw createError('Document not found', 404);
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record
    await DocumentModel.findByIdAndDelete(id);
  },

  async getDocumentPath(id: string): Promise<string> {
    const document = await this.getDocument(id);
    return path.join(process.cwd(), document.file_url);
  },

  async searchDocuments(filters: {
    hawb?: string;
    document_type?: DocumentType;
    file_name?: string;
  }): Promise<IDocument[]> {
    const query: any = {};

    if (filters.hawb) {
      const shipment = await Shipment.findOne({ hawb: filters.hawb.toUpperCase() });
      if (shipment) {
        query.shipment_id = shipment._id;
      } else {
        return [];
      }
    }
    if (filters.document_type) {
      query.document_type = filters.document_type;
    }
    if (filters.file_name) {
      query.file_name = { $regex: filters.file_name, $options: 'i' };
    }

    const documents = await DocumentModel.find(query)
      .sort({ uploaded_at: -1 })
      .populate('shipment_id', 'hawb')
      .lean<IDocument[]>();

    return documents as unknown as IDocument[];
  },
};
