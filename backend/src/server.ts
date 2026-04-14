// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend directory (where package.json is)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { responseCache } from './middleware/responseCache';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth';
import shipmentRoutes from './routes/shipments';
import trackingRoutes from './routes/tracking';
import operationRoutes from './routes/operations';
import podRoutes from './routes/pod';
import invoiceRoutes from './routes/invoices';
import ewayBillRoutes from './routes/ewayBills';
import documentRoutes from './routes/documents';
import auditRoutes from './routes/audit';
import driverRoutes from './routes/driver';
import userRoutes from './routes/users';
import branchRoutes from './routes/branches';
import reportRoutes from './routes/reports';
import partyRoutes from './routes/parties';
import employeeRoutes from './routes/employees';
import serviceTypeRoutes from './routes/serviceTypes';
import organizationRoutes from './routes/organization';
import rateSheetRoutes from './routes/rate-sheets';
import billingRoutes from './routes/billing';
import rateRoutes from './routes/rates';
import awbRoutes from './routes/awbs';
import pickupRoutes from './routes/pickups';
import manifestRoutes from './routes/manifests';
import drsRoutes from './routes/drs';
import dashboardRoutes from './routes/dashboard';
import notificationsRoutes from './routes/notifications';
import dutyBillRoutes from './routes/dutyBills';
import chatbotRoutes from './routes/chatbot';
const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || '/api';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Trust proxy for reverse proxy deployments (Nginx, AWS ELB, etc.)
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? undefined : false, // Relaxed in dev
  crossOriginEmbedderPolicy: false, // Allow embedding resources
}));

// CORS — whitelist production origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response time header — set BEFORE response is sent
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const originalEnd = res.end.bind(res);
  (res as any).end = function (...args: any[]) {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (!res.headersSent) {
      res.set('X-Response-Time', `${ms.toFixed(1)}ms`);
    }
    return originalEnd(...args);
  };
  next();
});

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Health check endpoint (no auth, no rate limit)
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heap: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  });
});

// API Routes
app.use(`${API_BASE_URL}/auth`, authRoutes);
app.use(`${API_BASE_URL}/dashboard`, dashboardRoutes);
app.use(`${API_BASE_URL}/shipments`, shipmentRoutes);
app.use(`${API_BASE_URL}/tracking`, trackingRoutes);
app.use(`${API_BASE_URL}/operations`, operationRoutes);
app.use(`${API_BASE_URL}/pod`, podRoutes);
app.use(`${API_BASE_URL}/invoices`, invoiceRoutes);
app.use(`${API_BASE_URL}/eway-bills`, ewayBillRoutes);
app.use(`${API_BASE_URL}/documents`, documentRoutes);
app.use(`${API_BASE_URL}/audit`, auditRoutes);
app.use(`${API_BASE_URL}/driver-assignments`, driverRoutes);
app.use(`${API_BASE_URL}/driver`, driverRoutes); // Alias for frontend
app.use(`${API_BASE_URL}/users`, userRoutes);

// Master data routes — server-side cached (5 min TTL)
app.use(`${API_BASE_URL}/branches`, responseCache(5 * 60 * 1000), branchRoutes);
app.use(`${API_BASE_URL}/service-types`, responseCache(5 * 60 * 1000), serviceTypeRoutes);
app.use(`${API_BASE_URL}/organization`, responseCache(10 * 60 * 1000), organizationRoutes);

app.use(`${API_BASE_URL}/reports`, reportRoutes);
app.use(`${API_BASE_URL}/parties`, partyRoutes);
app.use(`${API_BASE_URL}/employees`, employeeRoutes);
app.use(`${API_BASE_URL}/rate-sheets`, rateSheetRoutes);
app.use(`${API_BASE_URL}/billing`, billingRoutes);
app.use(`${API_BASE_URL}/rates`, responseCache(3 * 60 * 1000), rateRoutes);
app.use(`${API_BASE_URL}/awbs`, awbRoutes);
app.use(`${API_BASE_URL}/pickups`, pickupRoutes);
app.use(`${API_BASE_URL}/manifests`, manifestRoutes);
app.use(`${API_BASE_URL}/drs`, drsRoutes);
app.use(`${API_BASE_URL}/notifications`, notificationsRoutes);
app.use(`${API_BASE_URL}/duty-bills`, dutyBillRoutes);
app.use(`${API_BASE_URL}/chatbot`, chatbotRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
let server: any;

const startServer = async () => {
  try {
    await connectDatabase();

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}${API_BASE_URL}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Keep-alive timeout for production (default 5s is too short behind LB)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }

  // Close database connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  } catch (err) {
    logger.error('Error closing MongoDB connection:', err);
  }

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10_000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions — log but don't crash for non-fatal errors
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception:', error);
  // Only shutdown for truly fatal errors, not things like ERR_HTTP_HEADERS_SENT
  if (error?.code !== 'ERR_HTTP_HEADERS_SENT') {
    gracefulShutdown('uncaughtException');
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();

export default app;
