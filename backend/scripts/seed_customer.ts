import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';

// Load env from backend root
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedCustomer() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const email = 'customer@globaltech.com';
  const password = 'Password@123';
  const hash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });

  if (existing) {
    await User.updateOne({ email }, { $set: { password_hash: hash, role: 'customer', status: 'active' } });
    console.log(`✅ Updated password and role for Customer: ${email}`);
  } else {
    await User.create({
      email,
      name: 'Global Tech Manager',
      password_hash: hash,
      role: 'customer',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`✅ Created customer user: ${email}`);
  }

  console.log(`📝 Login with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);

  await mongoose.disconnect();
  process.exit(0);
}

seedCustomer().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
