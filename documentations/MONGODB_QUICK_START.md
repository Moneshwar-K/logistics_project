# MongoDB Atlas - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/login
2. Create a new cluster (Free tier M0 is fine for development)
3. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Username: `admin` (or your choice)
   - Password: Create a strong password
   - Privileges: "Atlas admin"
4. Whitelist your IP:
   - Go to "Network Access" → "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Get connection string:
   - Go to "Database" → Click "Connect" → "Connect your application"
   - Copy the connection string

**Example connection string:**
```
mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/logistics_erp?retryWrites=true&w=majority
```

### Step 2: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and paste your connection string:

```env
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/logistics_erp?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
PORT=3001
```

**Important:** If your password has special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### Step 3: Install and Run

```bash
# Install dependencies
npm install

# Start server
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on port 3001
📡 API available at http://localhost:3001/api
```

## ✅ That's It!

Your backend is now connected to MongoDB Atlas. The database and collections will be created automatically when you first use them.

## Test It

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User",
    "role": "admin"
  }'
```

## Troubleshooting

### Connection Error
- ✅ Check connection string format
- ✅ Verify username/password
- ✅ Check IP whitelist (should include your IP)
- ✅ Ensure cluster is running

### Authentication Failed
- ✅ Verify database user exists
- ✅ Check user permissions
- ✅ URL-encode special characters in password

### Database Not Found
- ✅ MongoDB creates database automatically
- ✅ Database name is in connection string (after `/`)
- ✅ Example: `...mongodb.net/logistics_erp?...`

## Next Steps

1. ✅ Backend connected to MongoDB
2. ⏳ Connect frontend (update `.env.local`)
3. ⏳ Test all API endpoints
4. ⏳ Start using the system!

---

**Need Help?** See `MONGODB_SETUP.md` for detailed instructions.

