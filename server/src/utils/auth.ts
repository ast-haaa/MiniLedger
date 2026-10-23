import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || 'miniledger_jwt_secret_key_2026';

/**
 * Generate a 6-digit mock OTP and log it to the server console.
 * In production, this would integrate with an SMS gateway (e.g. Twilio).
 */
export function generateMockOtp(phoneNumber: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`\n========================================`);
  console.log(`[MOCK OTP] Phone: ${phoneNumber} | Code: ${otp}`);
  console.log(`========================================\n`);
  return otp;
}

/**
 * Hash an OTP using SHA-256 so OTPs are never stored in plaintext in the database.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Generate a JWT token for an authenticated user ID.
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
