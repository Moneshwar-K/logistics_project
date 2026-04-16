# Backend Quick Start Guide

Get the backend running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=logistics_erp
JWT_SECRET=your-secret-key-change-this
```

## Step 3: Create Database

```bash
# Using psql
createdb logistics_erp

# Or using SQL
psql -U postgres
CREATE DATABASE logistics_erp;
```

## Step 4: Run Migrations

```bash
npm run migrate
```

This creates all database tables.

## Step 5: Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## Step 6: Test API

```bash
# Health check
curl http://localhost:3001/health

# Login (create user first via signup)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## Connect Frontend

Update frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Common Issues

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -l`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using port 3001

### Migration Errors
- Ensure database is empty or use `npm run migrate:rollback` first
- Check database user has CREATE privileges

## Next Steps

1. Implement remaining services (see `BACKEND_IMPLEMENTATION_GUIDE.md`)
2. Test with Postman/Thunder Client
3. Connect frontend
4. Start building features!

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run migrate      # Run migrations
npm run migrate:rollback  # Rollback last migration
npm test             # Run tests (when implemented)
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Route handlers
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   └── server.ts       # Entry point
├── migrations/         # Database migrations
└── package.json
```

## API Base URL

All API endpoints are prefixed with `/api`:

- `http://localhost:3001/api/auth/login`
- `http://localhost:3001/api/shipments`
- etc.

See `API_DOCUMENTATION.md` for complete API reference.

