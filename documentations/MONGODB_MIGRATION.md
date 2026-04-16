# MongoDB Atlas Migration Guide

## Overview

The backend has been migrated from PostgreSQL (Knex.js) to MongoDB Atlas (Mongoose).

## Changes Made

### 1. Database Configuration
- ✅ Replaced Knex.js with Mongoose
- ✅ Updated `src/config/database.ts` for MongoDB connection
- ✅ Added connection event handlers
- ✅ Graceful shutdown handling

### 2. Models Created
All database models converted to Mongoose schemas:
- ✅ User
- ✅ Branch
- ✅ Party
- ✅ Shipment
- ✅ TrackingEvent
- ✅ OperationStatusUpdate
- ✅ POD
- ✅ PODUpload
- ✅ Invoice
- ✅ Charge
- ✅ EWayBill
- ✅ Document
- ✅ HAWBAudit
- ✅ DriverAssignment

### 3. Environment Variables
Updated `.env.example` with MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 4. Dependencies
- ✅ Removed: `pg`, `knex`
- ✅ Added: `mongoose`
- ✅ Updated `package.json`

## Setup Instructions

### 1. Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (or use existing)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Click "Connect" → "Connect your application"
6. Copy the connection string

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/logistics_erp?retryWrites=true&w=majority
```

Replace:
- `yourusername` - Your MongoDB Atlas username
- `yourpassword` - Your MongoDB Atlas password
- `cluster0.xxxxx` - Your cluster address
- `logistics_erp` - Your database name (can be changed)

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Server

```bash
npm run dev
```

The server will automatically connect to MongoDB Atlas on startup.

## Model Structure

All models use Mongoose with:
- ✅ Proper TypeScript interfaces
- ✅ Schema validation
- ✅ Indexes for performance
- ✅ References to other collections
- ✅ Timestamps (created_at, updated_at)

## Key Differences from PostgreSQL

### Object IDs
- MongoDB uses `ObjectId` instead of UUIDs
- References use `Schema.Types.ObjectId`
- IDs are automatically generated

### Queries
- Services now use Mongoose methods:
  - `Model.find()`, `Model.findOne()`, `Model.findById()`
  - `Model.create()`, `Model.save()`
  - `Model.updateOne()`, `Model.deleteOne()`
  - `.populate()` for references

### No Migrations
- MongoDB doesn't require migrations
- Schemas are applied automatically
- Indexes are created on first use

## Services Update Status

All services need to be updated to use Mongoose models. The structure is ready, but queries need to be converted from Knex.js to Mongoose.

### Example Conversion

**Before (Knex.js):**
```typescript
const user = await db('users').where({ email }).first();
```

**After (Mongoose):**
```typescript
const user = await User.findOne({ email });
```

## Next Steps

1. ✅ Models created
2. ⏳ Update all services to use Mongoose queries
3. ⏳ Test all endpoints
4. ⏳ Verify data relationships

## Testing Connection

Test your MongoDB connection:

```bash
# Start server
npm run dev

# You should see:
# ✅ Connected to MongoDB Atlas
# 🚀 Server running on port 3001
```

If connection fails, check:
- Connection string format
- Username/password
- IP whitelist
- Network connectivity

## Production Notes

- Use connection pooling (already configured)
- Set up MongoDB Atlas monitoring
- Configure backups
- Use read replicas for scaling
- Set up indexes for performance

