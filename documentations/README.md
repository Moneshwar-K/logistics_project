# Logistics ERP Backend API

Production-grade backend API for the Logistics ERP system using **MongoDB Atlas**.

## Features

- ✅ RESTful API with Express.js
- ✅ TypeScript for type safety
- ✅ MongoDB Atlas with Mongoose
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ File upload handling
- ✅ Input validation ready
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Rate limiting
- ✅ Security headers (Helmet)

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB Atlas connection string
# Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001/api`

## MongoDB Atlas Setup

1. **Get Connection String:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster
   - Create database user
   - Whitelist IP (0.0.0.0/0 for development)
   - Copy connection string

2. **Update .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/logistics_erp?retryWrites=true&w=majority
   ```

3. **Start Server:**
   ```bash
   npm run dev
   ```

See `MONGODB_SETUP.md` for detailed instructions.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── uploads/            # File uploads directory
└── logs/               # Application logs
```

## API Documentation

See `API_DOCUMENTATION.md` for complete API reference.

## Environment Variables

See `.env.example` for all available environment variables.

**Required:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Database

- **Database:** MongoDB Atlas (cloud)
- **ORM:** Mongoose
- **Collections:** Auto-created on first use
- **Indexes:** Auto-created from schema definitions

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update MongoDB Atlas connection string
3. Set secure `JWT_SECRET`
4. Configure file storage (AWS S3 recommended)
5. Build the project: `npm run build`
6. Start server: `npm start`

## License

ISC
