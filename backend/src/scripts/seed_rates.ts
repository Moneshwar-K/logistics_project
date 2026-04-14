import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const RateSheetSchema = new mongoose.Schema({
  type: { type: String, default: 'general' },
  service_type: { type: String, required: true },
  status: { type: String, default: 'active' },
  rows: [{
    min_weight: Number,
    max_weight: Number,
    zone: String,
    rate: Number
  }],
  created_at: { type: Date, default: Date.now }
});

const RateSheet = mongoose.model('RateSheet', RateSheetSchema);

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_portal';
  console.log('Connecting to:', uri);
  
  await mongoose.connect(uri);
  
  const services = ['air', 'sea', 'land'];
  
  for (const service of services) {
    const existing = await RateSheet.findOne({ service_type: service, status: 'active' });
    if (!existing) {
      console.log(`Creating rate sheet for ${service}...`);
      await RateSheet.create({
        type: 'general',
        service_type: service,
        status: 'active',
        rows: [
          { min_weight: 0, max_weight: 10, zone: 'A', rate: 100 },
          { min_weight: 10, max_weight: 50, zone: 'A', rate: 80 },
          { min_weight: 50, max_weight: 1000, zone: 'A', rate: 50 },
          { min_weight: 0, max_weight: 10, zone: 'B', rate: 120 },
          { min_weight: 10, max_weight: 50, zone: 'B', rate: 100 },
          { min_weight: 50, max_weight: 1000, zone: 'B', rate: 70 },
          { min_weight: 0, max_weight: 10, zone: 'C', rate: 150 },
          { min_weight: 10, max_weight: 50, zone: 'C', rate: 130 },
          { min_weight: 50, max_weight: 1000, zone: 'C', rate: 90 },
        ]
      });
    } else {
      console.log(`Rate sheet for ${service} already exists.`);
    }
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
