import jwt from 'jsonwebtoken';
import { JWTPayload } from '../middleware/auth';

/**
 * JWT Utilities
 * 
 * All environment variable validation is lazy - it only happens when
 * functions are called, not at module load time. This allows the
 * module to be imported even if .env file is missing.
 */

// Lazy getter for JWT secret (validates only when called)
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. Please add it to your .env file.');
  }
  return secret;
}

function getJWTRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required. Please add it to your .env file.');
  }
  return secret;
}

export function generateToken(payload: JWTPayload): string {
  const JWT_SECRET = getJWTSecret();
  const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  const JWT_REFRESH_SECRET = getJWTRefreshSecret();
  const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload {
  const JWT_SECRET = getJWTSecret();

  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  const JWT_REFRESH_SECRET = getJWTRefreshSecret();

  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}

