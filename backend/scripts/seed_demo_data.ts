import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Branch } from '../src/models/Branch';
import { User } from '../src/models/User';
import { Party } from '../src/models/Party';
import { Shipment } from '../src/models/Shipment';
import { Invoice } from '../src/models/Invoice';
import { TrackingEvent } from '../src/models/TrackingEvent';
import { HAWBAudit } from '../src/models/HAWBAudit';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedProfessionalData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // 1. Create Branches
    const branches = [
      {
        name: 'Delhi International Hub',
        code: 'DH-01',
        branch_type: 'hub',
        address: 'IGI Airport, Cargo Terminal',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110037',
        country: 'India',
        contact_email: 'delhi.hub@sricaargo.com',
        contact_phone: '+91 11 25678901',
      },
      {
        name: 'Mumbai Air Cargo Complex',
        code: 'MACC-4',
        branch_type: 'origin',
        address: 'Sahar Cargo, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400099',
        country: 'India',
        contact_email: 'mumbai.ops@sricaargo.com',
        contact_phone: '+91 22 26812345',
      },
      {
        name: 'Bangalore Strategic Warehouse',
        code: 'BLR-WH-02',
        branch_type: 'warehouse',
        address: 'Devanahalli Industrial Area',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '562110',
        country: 'India',
        contact_email: 'blr.wh@sricaargo.com',
        contact_phone: '+91 80 27654321',
      }
    ];

    const branchDocs = [];
    for (const b of branches) {
      const existing = await Branch.findOne({ code: b.code });
      if (!existing) {
        const doc = await Branch.create(b);
        branchDocs.push(doc);
        console.log(`🏢 Branch created: ${b.name}`);
      } else {
        branchDocs.push(existing);
      }
    }

    const mainBranch = branchDocs[0];

    // 2. Create Users (Admin already exists, adding Operations and Finance)
    const roleUsers = [
      {
        email: 'ops.manager@sricaargo.com',
        password: 'Password@123',
        name: 'Rajesh Kumar',
        role: 'operations',
        branch_id: mainBranch._id,
      },
      {
        email: 'finance.lead@sricaargo.com',
        password: 'Password@123',
        name: 'Anita Sharma',
        role: 'finance',
        branch_id: mainBranch._id,
      }
    ];

    const userDocs = [];
    // Get existing admin too
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) userDocs.push(adminUser);

    for (const u of roleUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        const doc = await User.create({
          ...u,
          password_hash: hash,
          status: 'active'
        });
        userDocs.push(doc);
        console.log(`👤 User created: ${u.name} (${u.role})`);
      } else {
        userDocs.push(existing);
      }
    }

    // 3. Create Parties (Shippers and Consignees)
    const parties = [
      {
        name: 'Global Tech Logistics',
        email: 'shipping@globaltech.com',
        phone: '9876543210',
        address: 'Electronics City',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        party_type: 'client',
        gst_number: '29AAAAA0000A1Z5',
      },
      {
        name: 'South Asia Traders Ltd.',
        email: 'info@satraders.com',
        phone: '9123456789',
        address: 'Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        party_type: 'client',
        gst_number: '27BBBBB1111B2Z6',
      },
      {
        name: 'Precision Instruments Inc.',
        email: 'logistics@precision.com',
        phone: '8887776665',
        address: 'Okhla Industrial Estate',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110020',
        party_type: 'client',
        gst_number: '07CCCCC2222C3Z7',
      },
      {
        name: 'Modern Retail Corp',
        email: 'receivals@modernretail.com',
        phone: '7776665554',
        address: 'Orchard Road',
        city: 'Singapore',
        state: 'SG',
        pincode: '238823',
        country: 'Singapore',
        party_type: 'consignee',
      }
    ];

    const partyDocs = [];
    for (const p of parties) {
      const existing = await Party.findOne({ email: p.email });
      if (!existing) {
        const doc = await Party.create(p);
        partyDocs.push(doc);
        console.log(`🤝 Party created: ${p.name}`);
      } else {
        partyDocs.push(existing);
      }
    }

    const shipper = partyDocs[0];
    const consignee = partyDocs[3];

    // 4. Create Shipments and Tracking
    const shipments = [
      {
        hawb: 'SRI-DEL-24001',
        origin_city: 'New Delhi',
        origin_country: 'India',
        destination_city: 'Singapore',
        destination_country: 'Singapore',
        service_type: 'air',
        shipment_type: 'parcel',
        total_cartons: 5,
        total_weight: 45.5,
        invoice_value: 125000,
        status: 'delivered',
        actual_delivery_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        mode: 'air',
      },
      {
        hawb: 'SRI-BOM-24002',
        origin_city: 'Mumbai',
        origin_country: 'India',
        destination_city: 'Singapore',
        destination_country: 'Singapore',
        service_type: 'air',
        shipment_type: 'cargo',
        total_cartons: 12,
        total_weight: 180.0,
        invoice_value: 450000,
        status: 'in_transit',
        mode: 'air',
      },
      {
        hawb: 'SRI-BLR-24003',
        origin_city: 'Bangalore',
        origin_country: 'India',
        destination_city: 'New Delhi',
        destination_country: 'India',
        service_type: 'land',
        shipment_type: 'parcel',
        total_cartons: 2,
        total_weight: 15.0,
        invoice_value: 35000,
        status: 'picked_up',
        mode: 'land',
      }
    ];

    for (const s of shipments) {
      const existing = await Shipment.findOne({ hawb: s.hawb });
      if (!existing) {
        const doc = await Shipment.create({
          ...s,
          shipper_id: shipper._id,
          consignee_id: consignee._id,
          branch_id: mainBranch._id,
          created_by_id: adminUser?._id,
        });
        console.log(`📦 Shipment created: ${s.hawb}`);

        // 5. Create Invoices for 'delivered' or 'in_transit' shipments
        if (s.status === 'delivered' || s.status === 'in_transit') {
          const subtotal = 15000 + (s.total_weight * 50);
          const tax = subtotal * 0.18;
          await Invoice.create({
            invoice_number: `INV-${s.hawb}`,
            shipment_id: doc._id,
            billed_party_id: shipper._id,
            branch_id: mainBranch._id,
            invoice_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subtotal,
            tax_percentage: 18,
            tax_amount: tax,
            total_amount: subtotal + tax,
            currency: 'INR',
            payment_status: s.status === 'delivered' ? 'paid' : 'pending',
            paid_amount: s.status === 'delivered' ? subtotal + tax : 0,
            balance_amount: s.status === 'delivered' ? 0 : subtotal + tax,
          });
          console.log(`📄 Invoice created for ${s.hawb}`);
        }

        // 6. Create Tracking Events
        const locations = ['Warehouse Pickup', 'Terminal Handling', 'In Transit', 'Destination Airport'];
        for (let i = 0; i <= (s.status === 'delivered' ? 3 : 1); i++) {
          await TrackingEvent.create({
            shipment_id: doc._id,
            status: i === 3 ? 'delivered' : 'in_transit',
            location: locations[i],
            city: s.origin_city,
            country: s.origin_country,
            timestamp: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000),
            scanned_by: 'System Auto-Seed',
            remarks: `Automated scan at ${locations[i]}`,
          });
        }

        // 7. Create Audit Log for 'delivered' shipments
        if (s.status === 'delivered') {
          await HAWBAudit.create({
            hawb: s.hawb,
            shipment_id: doc._id,
            audit_status: 'completed',
            audit_date: new Date(),
            audited_by_id: adminUser?._id,
            total_cartons: s.total_cartons,
            cartons_verified: s.total_cartons,
            weight_variance: 0,
            branch_id: mainBranch._id,
          });
          console.log(`🔍 Audit log created for ${s.hawb}`);
        }
      }
    }

    console.log('✨ Professional Seeding Completed!');
    await mongoose.disconnect();
    process.exit(0);

  } catch (err: any) {
    console.error('❌ Error during seeding:', err.message);
    process.exit(1);
  }
}

seedProfessionalData();
