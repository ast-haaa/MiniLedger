import { PrismaClient } from '@prisma/client';
import { MemoryUser, MemoryLoan, MemoryRepayment, MemoryOtp } from '../types';

export const prisma = new PrismaClient();

export const dbState = {
  isPostgresConnected: false,
};

export const memoryStore = {
  users: [] as MemoryUser[],
  loans: [] as MemoryLoan[],
  repayments: [] as MemoryRepayment[],
  otps: new Map<string, MemoryOtp>(),
};

/**
 * Check database connectivity on boot.
 * If PostgreSQL is unreachable or in test environment, falls back seamlessly to in-memory store.
 */
export async function initDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    dbState.isPostgresConnected = false;
    return;
  }
  try {
    await prisma.$connect();
    dbState.isPostgresConnected = true;
    console.log('✅ Connected to PostgreSQL database via Prisma');
  } catch (err) {
    dbState.isPostgresConnected = false;
    console.warn(
      '⚠️ PostgreSQL is not reachable on localhost:5432. Running with in-memory resilient store so MiniLedger works seamlessly.'
    );
  }
}
