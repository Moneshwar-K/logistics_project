import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env from backend root
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');

  const email = 'admin@example.com';
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);

  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne({ email }, { $set: { password_hash: hash, role: 'admin', status: 'active' } });
    console.log(`✅ Updated password and role for ${email}`);
  } else {
    await users.insertOne({
      email,
      name: 'Admin User',
      password_hash: hash,
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`✅ Created admin user: ${email}`);
  }

  console.log(`📝 Login with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
