import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Shipment, Branch, User, ServiceType, RateSheet } from './models';
import { shipmentService } from './services/shipmentService';
import { invoiceService } from './services/invoiceService';
import { manifestService } from './services/manifestService';
import { dutyBillService } from './services/dutyBillService';

dotenv.config();

async function runDiagnostic() {
  console.log('🚀 Starting System Diagnostic...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // 1. Setup Test Data
    const branch = await Branch.findOne() || await Branch.create({ name: 'Delhi International Hub', code: 'DEL', location: 'Delhi', contact_email: 'delhi@test.com', contact_phone: '1234567890' });
    const user = await User.findOne() || await User.create({ name: 'Super Admin', email: 'admin@test.com', password_hash: 'hashed', role: 'admin', branch_id: branch._id });

    // Seed Service Type
    let service = await ServiceType.findOne({ code: 'AIR' });
    if (!service) {
      service = await ServiceType.create({
        code: 'AIR',
        name: 'Air Freight',
        mode: 'air',
        transit_days: 2,
        status: 'active'
      });
      console.log('🌱 Seeded ServiceType: AIR');
    }

    // Seed Rate Sheet
    let rateSheet = await RateSheet.findOne({ service_type: 'air', status: 'active' });
    if (!rateSheet) {
      rateSheet = await RateSheet.create({
        name: 'General Air Rates',
        type: 'general',
        service_type: 'air',
        valid_from: new Date(),
        status: 'active',
        rows: [
          { min_weight: 0, max_weight: 10, rate: 50, zone: 'A' },
          { min_weight: 10, max_weight: 50, rate: 45, zone: 'A' }
        ]
      });
      console.log('🌱 Seeded RateSheet: General Air Rates');
    }

    console.log(`📍 Using Branch: ${branch.name} (${branch._id})`);
    console.log(`👤 Using User: ${user.name} (${user._id})`);

    // 2. Test Shipment Creation
    console.log('\n📦 Testing Shipment (HAWB) Creation...');
    const shipmentData = {
      origin_city: 'Delhi',
      origin_country: 'India',
      destination_city: 'Chennai',
      destination_country: 'India',
      total_cartons: 5,
      total_weight: 12.5,
      service_type: 'air',
      shipment_type: 'parcel',
      mode: 'air',
      invoice_value: 1000,
      shipper: {
        name: 'Test Shipper',
        email: 'shipper@test.com',
        phone: '1234567890',
        address: 'Delhi 123',
        city: 'Delhi',
        country: 'India'
      },
      consignee: {
        name: 'Test Consignee',
        email: 'consignee@test.com',
        phone: '0987654321',
        address: 'Chennai 456',
        city: 'Chennai',
        country: 'India'
      },
      branch_id: branch._id,
      created_by_id: user._id
    };

    const shipment = await shipmentService.createShipment(shipmentData, user._id.toString(), branch._id.toString());
    console.log(`✅ Shipment created: ${shipment.hawb} (Status: ${shipment.status})`);

    // 3. Test Invoice Generation
    console.log('\n💰 Testing Invoice Generation...');
    const invoice = await invoiceService.createInvoice(shipment._id.toString(), user._id.toString(), branch._id.toString());
    console.log(`✅ Invoice generated: ${invoice.invoice_number} (Amount: ₹${invoice.total_amount})`);

    // 4. Test Manifest Creation
    console.log('\n🚛 Testing Manifest Creation...');
    const manifest = await manifestService.createManifest({
      origin_branch_id: branch._id,
      destination_branch_id: branch._id,
      shipment_ids: [shipment._id],
      vehicle_number: 'TEST-001',
      driver_name: 'Test Driver',
      created_by_id: user._id
    });
    console.log(`✅ Manifest created: ${manifest.manifest_number} (Shipments: ${manifest.total_shipments})`);

    // Verify Shipment Status
    const updatedShipment = await Shipment.findById(shipment._id);
    console.log(`📊 Shipment Status after manifest: ${updatedShipment?.status}`);

    // 5. Test Duty Bill Creation
    console.log('\n📜 Testing Duty Bill Creation...');
    const dutyBill = await dutyBillService.createDutyBill({
        shipment_ids: [shipment._id],
        invoice_date: new Date(),
        basic_customs_duty: 500,
        igst_amount: 100,
        subtotal: 600,
        total_amount: 600
    }, user._id.toString(), branch._id.toString());
    console.log(`✅ Duty Bill created: ${dutyBill.bill_number} (Amount: ₹${dutyBill.total_amount})`);

    console.log('\n⭐ DIAGNOSTIC COMPLETE: ALL SYSTEMS NOMINAL ⭐');

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC FAILED:');
    console.error(error);
  } finally {
    // Cleanup - We'll leave it for now so the user can see the records in DB, 
    // or we can uncomment to keep DB clean
    /*
    await Shipment.deleteOne({ hawb: shipment.hawb });
    await Invoice.deleteOne({ invoice_number: invoice.invoice_number });
    await Manifest.deleteOne({ manifest_number: manifest.manifest_number });
    await DutyBill.deleteOne({ bill_number: dutyBill.bill_number });
    */
    await mongoose.disconnect();
    process.exit();
  }
}

runDiagnostic();
