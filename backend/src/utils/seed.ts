import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { ServiceType } from '../models/ServiceType';
import { Rate } from '../models/Rate';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function seed() {
    try {
        logger.info('Starting database seed...');
        await connectDatabase();

        // 1. Seed Branch
        logger.info('Seeding Branches...');
        let hqBranch = await Branch.findOne({ branch_code: 'HQ01' });
        if (!hqBranch) {
            hqBranch = await Branch.create({
                branch_name: 'SRI CAARGO HQ',
                branch_code: 'HQ01',
                branch_type: 'origin',
                address: '123 Logistics Park, Ring Road',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001',
                country: 'India',
                contact_person: 'Admin User',
                contact_number: '+91 9876543210',
                email: 'hq@sricaargo.com',
                status: 'active',
            });
            logger.info('Created HQ Branch');
        } else {
            logger.info('HQ Branch already exists, skipping.');
        }

        // 2. Seed Service Types
        logger.info('Seeding Service Types...');
        const serviceTypes = ['Air Freight', 'Surface', 'Express', 'Economy', 'Local Delivery'];
        for (const name of serviceTypes) {
            const exists = await ServiceType.findOne({ service_name: name });
            if (!exists) {
                await ServiceType.create({
                    service_name: name,
                    description: `Standard ${name} service`,
                    base_price: Math.floor(Math.random() * 500) + 100,
                    price_per_kg: Math.floor(Math.random() * 50) + 10,
                    status: 'active',
                });
                logger.info(`Created Service Type: ${name}`);
            }
        }

        // 3. Seed Admin User
        logger.info('Seeding Admin User...');
        const adminEmail = 'admin@sricaargo.com';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash('Admin@123', salt);
            await User.create({
                email: adminEmail,
                password_hash,
                name: 'Super Admin',
                role: 'admin',
                branch_id: hqBranch._id,
                status: 'active',
            });
            logger.info('Created Admin User (admin@sricaargo.com / Admin@123)');
        } else {
            logger.info('Admin User already exists, skipping.');
        }

        // 4. Seed sample Rates
        logger.info('Seeding Sample Rates...');
        const service = await ServiceType.findOne({ status: 'active' });
        if (service) {
            const rateExists = await Rate.findOne({ origin_zone: 'CHENNAI, ZONE-A' });
            if (!rateExists) {
                await Rate.create({
                    description: 'Standard City to City Rate',
                    origin_zone: 'CHENNAI, ZONE-A',
                    destination_zone: 'DELHI, ZONE-B',
                    service_type_id: service._id,
                    effective_date: new Date(),
                    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    status: 'active',
                    currency: 'INR',
                    slabs: [
                        { min_weight: 0, max_weight: 5, rate: 50 },
                        { min_weight: 5.1, max_weight: 20, rate: 45 },
                        { min_weight: 20.1, max_weight: 100, rate: 40 },
                    ],
                    additional_charges: [
                        { name: 'Fuel Surcharge', value: 10, type: 'percentage' },
                        { name: 'Docket Charge', value: 50, type: 'fixed' },
                    ],
                });
                logger.info('Created Sample Rate Sheet');
            } else {
                logger.info('Sample Rate already exists, skipping.');
            }
        }

        logger.info('✅ Database Seed Complete!');
        process.exit(0);
    } catch (error) {
        logger.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
