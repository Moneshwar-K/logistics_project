import rateLimit from 'express-rate-limit';

// General API rate limiter: 200 requests per 15 minutes
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'),
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Check Retry-After header for wait time.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Strict rate limiter for auth endpoints: 10 attempts per 15 min
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT || '10'),
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many login attempts from this IP. Please wait 15 minutes.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Heavy operation limiter: file uploads, PDF generation, exports
export const heavyOpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many resource-intensive requests. Please wait.',
    timestamp: new Date().toISOString(),
  },
});
