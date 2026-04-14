import nodemailer from 'nodemailer';
import { COMPANY_CONFIG } from '../config/company-config';

// Lazy-initialized transporter (created on first use, after dotenv has loaded)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    // Verify connection on first creation
    transporter.verify((error) => {
      if (error) {
        console.log('Email transporter error:', error);
      } else {
        console.log('✓ Email server is ready to send messages');
      }
    });
  }
  return transporter;
}

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: `${COMPANY_CONFIG.name} <${process.env.SMTP_FROM || COMPANY_CONFIG.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
      attachments: options.attachments,
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✓ Email sent to: ${mailOptions.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Email templates
 */

export const emailTemplates = {
  // Shipment booking confirmation
  shipmentBooking: (data: {
    customerName: string;
    hawb: string;
    origin: string;
    destination: string;
    serviceType: string;
    cartons: number;
    weight: number;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B1538; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B1538; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #8B1538; color: white; text-decoration: none; border-radius: 3px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Shipment Booking Confirmed</h1>
          <p>SRI CAARGO - Your Logistics Partner</p>
        </div>
        
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your shipment has been successfully booked with Sri Caargo. Below are the details:</p>
          
          <div class="details">
            <h3>Shipment Details</h3>
            <p><strong>HAWB Number:</strong> ${data.hawb}</p>
            <p><strong>Service Type:</strong> ${data.serviceType.toUpperCase()}</p>
            <p><strong>Origin:</strong> ${data.origin}</p>
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Total Cartons:</strong> ${data.cartons}</p>
            <p><strong>Total Weight:</strong> ${data.weight} kg</p>
          </div>
          
          <p>You can track your shipment anytime using the HAWB number on our website.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracking?hawb=${data.hawb}" class="button">Track Shipment</a>
          </p>
        </div>
        
        <div class="footer">
          <p>${COMPANY_CONFIG.address.line1}, ${COMPANY_CONFIG.address.city}</p>
          <p>Email: ${COMPANY_CONFIG.email} | Phone: ${COMPANY_CONFIG.phone}</p>
          <p>Website: ${COMPANY_CONFIG.website}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Status update notification
  statusUpdate: (data: {
    customerName: string;
    hawb: string;
    status: string;
    location: string;
    remarks?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B1538; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .status-badge { display: inline-block; padding: 8px 15px; background: #1976d2; color: white; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #8B1538; color: white; text-decoration: none; border-radius: 3px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Shipment Status Update</h1>
        </div>
        
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your shipment <strong>${data.hawb}</strong> has a new update:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge">${data.status.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          
          <p><strong>Current Location:</strong> ${data.location}</p>
          ${data.remarks ? `<p><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracking?hawb=${data.hawb}" class="button">View Full Tracking</a>
          </p>
        </div>
        
        <div class="footer">
          <p>${COMPANY_CONFIG.email} | ${COMPANY_CONFIG.phone}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Delivery confirmation with POD
  deliveryConfirmation: (data: {
    customerName: string;
    hawb: string;
    deliveryDate: string;
    receiverName: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .success-icon { font-size: 48px; text-align: center; color: #2e7d32; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Shipment Delivered Successfully</h1>
        </div>
        
        <div class="content">
          <div class="success-icon">✓</div>
          <p>Dear ${data.customerName},</p>
          <p>Great news! Your shipment <strong>${data.hawb}</strong> has been delivered successfully.</p>
          
          <p><strong>Delivery Date:</strong> ${data.deliveryDate}</p>
          <p><strong>Received By:</strong> ${data.receiverName}</p>
          
          <p>The Proof of Delivery (POD) is attached to this email for your records.</p>
          
          <p>Thank you for choosing Sri Caargo!</p>
        </div>
        
        <div class="footer">
          <p>${COMPANY_CONFIG.email} | ${COMPANY_CONFIG.phone}</p>
          <p>Website: ${COMPANY_CONFIG.website}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Invoice email
  invoice: (data: {
    customerName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paymentStatus: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B1538; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #8B1538; text-align: center; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice</h1>
        </div>
        
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Please find your invoice attached for the logistics services provided by Sri Caargo.</p>
          
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Payment Status:</strong> ${data.paymentStatus.toUpperCase()}</p>
          
          <div class="amount">
            Total Amount: ₹${data.totalAmount.toFixed(2)}
          </div>
          
          <p>Please make the payment by the due date. For any queries, feel free to contact us.</p>
        </div>
        
        <div class="footer">
          <p>${COMPANY_CONFIG.email} | ${COMPANY_CONFIG.phone}</p>
        </div>
      </div>
    </body>
    </html>
  `,
};
