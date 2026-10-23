import { Request } from 'express';
import { Prisma } from '@prisma/client';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface MemoryUser {
  id: string;
  phoneNumber: string;
  createdAt: Date;
}

export interface MemoryLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: string; // Stored as decimal string
  dueDate: Date;
  notes?: string | null;
  status: string;
  createdAt: Date;
}

export interface MemoryRepayment {
  id: string;
  loanId: string;
  amount: string; // Stored as decimal string
  repaidAt: Date;
}

export interface MemoryOtp {
  id: string;
  phoneNumber: string;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface SummaryResult {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdue: number;
  totalLoans: number;
}
