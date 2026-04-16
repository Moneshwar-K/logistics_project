# MongoDB Atlas Setup Guide

## Quick Setup

### 1. Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (or use existing)
4. Click "Connect" → "Connect your application"
5. Copy the connection string

It will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and replace the MongoDB URI:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/logistics_erp?retryWrites=true&w=majority
```

**Important:**
- Replace `<username>` with your MongoDB Atlas username
- Replace `<password>` with your MongoDB Atlas password
- Replace `<cluster>` with your cluster address
- Replace `<database>` with your database name (e.g., `logistics_erp`)

### 3. Set Up Database User

1. In MongoDB Atlas, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password
5. Set privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### 4. Whitelist IP Address

1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses
5. Click "Confirm"

### 5. Install Dependencies

```bash
npm install
```

This will install `mongoose` and other dependencies.

### 6. Start Server

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on port 3001
```

## Database Structure

MongoDB will automatically create collections when you first insert data:
- `users`
- `branches`
- `parties`
- `shipments`
- `trackingevents`
- `operationstatusupdates`
- `pods`
- `poduploads`
- `invoices`
- `charges`
- `ewaybills`
- `documents`
- `hawbaudits`
- `driverassignments`

## No Migrations Needed!

Unlike SQL databases, MongoDB doesn't require migrations. Collections and indexes are created automatically when you first use them.

## Testing Connection

Test your connection:

```bash
# Start server
npm run dev

# Check logs for:
# ✅ Connected to MongoDB Atlas
```

If you see connection errors:
1. Check your connection string format
2. Verify username/password
3. Check IP whitelist
4. Verify network connectivity

## Production Notes

- Use connection string with credentials
- Set up proper IP whitelisting
- Enable MongoDB Atlas monitoring
- Set up automated backups
- Use connection pooling (already configured)
- Monitor performance metrics

## Troubleshooting

### Connection Timeout
- Check IP whitelist
- Verify network connectivity
- Check firewall settings

### Authentication Failed
- Verify username/password
- Check database user permissions
- Ensure special characters in password are URL-encoded

### Database Not Found
- MongoDB will create the database automatically
- Ensure database name in connection string is correct

## Example .env

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://admin:MyP@ssw0rd123@cluster0.abc123.mongodb.net/logistics_erp?retryWrites=true&w=majority

# Other settings...
JWT_SECRET=your-secret-key
PORT=3001
```

**Note:** If your password contains special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- etc.

