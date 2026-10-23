import { Router } from 'express';
import { prisma, dbState, memoryStore } from '../config/db';
import { generateMockOtp, hashOtp, generateToken } from '../utils/auth';

const router = Router();

/**
 * POST /api/auth/send-otp
 * Generates and logs a 6-digit mock OTP to the server console.
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 8) {
      res.status(400).json({ error: 'Valid phone number is required (min 8 digits)' });
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const otp = generateMockOtp(cleanPhone);
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    if (dbState.isPostgresConnected) {
      await prisma.otpVerification.upsert({
        where: { phoneNumber: cleanPhone },
        update: {
          otpHash,
          attempts: 0,
          expiresAt,
        },
        create: {
          phoneNumber: cleanPhone,
          otpHash,
          attempts: 0,
          expiresAt,
        },
      });
    } else {
      memoryStore.otps.set(cleanPhone, {
        id: Math.random().toString(36).substring(2, 9),
        phoneNumber: cleanPhone,
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully. Check your server terminal console!',
      mockOtp: otp,
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP, checks expiration & attempts, and issues a JWT token.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: 'Phone number and OTP code are required' });
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const inputOtp = otp.toString().trim();

    let otpRecord: { otpHash: string; attempts: number; expiresAt: Date } | null = null;

    if (dbState.isPostgresConnected) {
      otpRecord = await prisma.otpVerification.findUnique({
        where: { phoneNumber: cleanPhone },
      });
    } else {
      otpRecord = memoryStore.otps.get(cleanPhone) || null;
    }

    if (!otpRecord) {
      res.status(400).json({ error: 'No active OTP found. Please request a new code.' });
      return;
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expiresAt)) {
      if (dbState.isPostgresConnected) {
        await prisma.otpVerification.delete({ where: { phoneNumber: cleanPhone } });
      } else {
        memoryStore.otps.delete(cleanPhone);
      }
      res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
      return;
    }

    // Check max attempts (limit to 5)
    if (otpRecord.attempts >= 5) {
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
      return;
    }

    // Compare hash
    const incomingHash = hashOtp(inputOtp);
    if (incomingHash !== otpRecord.otpHash) {
      if (dbState.isPostgresConnected) {
        await prisma.otpVerification.update({
          where: { phoneNumber: cleanPhone },
          data: { attempts: { increment: 1 } },
        });
      } else {
        otpRecord.attempts += 1;
      }
      res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
      return;
    }

    // Valid OTP - retrieve or create user
    let user: { id: string; phoneNumber: string };

    if (dbState.isPostgresConnected) {
      let existingUser = await prisma.user.findUnique({
        where: { phoneNumber: cleanPhone },
      });

      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: { phoneNumber: cleanPhone },
        });
      }
      user = existingUser;

      // Clean up used OTP
      await prisma.otpVerification.delete({ where: { phoneNumber: cleanPhone } });
    } else {
      let memUser = memoryStore.users.find((u) => u.phoneNumber === cleanPhone);
      if (!memUser) {
        memUser = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          phoneNumber: cleanPhone,
          createdAt: new Date(),
        };
        memoryStore.users.push(memUser);
      }
      user = memUser;
      memoryStore.otps.delete(cleanPhone);
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
