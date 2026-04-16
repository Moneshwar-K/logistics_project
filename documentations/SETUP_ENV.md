# Environment Setup

## Quick Fix for MONGODB_URI Error

The error occurs because the `.env` file is missing. Here's how to fix it:

### Step 1: Create .env File

In the `backend` directory, create a file named `.env` (no extension).

### Step 2: Add Your MongoDB Connection String

Copy this template into your `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=/api

# MongoDB Atlas Configuration
# REPLACE THE PLACEHOLDER BELOW WITH YOUR ACTUAL MONGODB ATLAS CONNECTION STRING
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/logistics_erp?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Step 3: Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (or use existing)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<database>` with your database name (e.g., `logistics_erp`)

### Step 4: Update .env File

Replace the `MONGODB_URI` line with your actual connection string.

### Step 5: Restart Server

```bash
npm run dev
```

## Example

If your connection string is:
```
mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/logistics_erp?retryWrites=true&w=majority
```

Your `.env` file should have:
```env
MONGODB_URI=mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/logistics_erp?retryWrites=true&w=majority
```

## Important Notes

- **Password with special characters**: URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

- **File location**: The `.env` file must be in the `backend` directory (same level as `package.json`)

- **Security**: Never commit `.env` to git (it's already in `.gitignore`)

## Still Having Issues?

1. Check that `.env` file is in `backend/` directory
2. Verify connection string format
3. Ensure MongoDB Atlas IP whitelist includes your IP
4. Check MongoDB Atlas cluster is running

