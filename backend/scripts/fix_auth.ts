
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/User';
import { hashPassword } from '../src/utils/password';

// Load env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function fixAuth() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find recent users
        const users = await User.find().sort({ created_at: -1 }).limit(5);

        console.log('Recent Users:');
        users.forEach(u => {
            console.log(`- ${u.email} (${u.name}) [Result: ${u.password_hash ? 'Has Password' : 'No Password'}]`);
        });

        if (users.length > 0) {
            const targetUser = users[0];
            console.log(`\nResetting password for: ${targetUser.email}`);

            const newPassword = 'password123';
            const hashedPassword = await hashPassword(newPassword);

            targetUser.password_hash = hashedPassword;
            await targetUser.save();

            console.log(`Password reset to: ${newPassword}`);
        } else {
            console.log('No users found to fix.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixAuth();
