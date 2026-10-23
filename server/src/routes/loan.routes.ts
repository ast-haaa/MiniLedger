import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest, MemoryLoan, MemoryRepayment } from '../types';
import { authenticate } from '../middleware/auth.middleware';
import { prisma, dbState, memoryStore } from '../config/db';
import { toDecimalString } from '../utils/formatters';

const router = Router();

// Protect all loan routes with JWT authentication
router.use(authenticate);

/**
 * GET /api/loans
 * Retrieve all loans created by the authenticated user with calculated repayment totals and dynamic status.
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    if (dbState.isPostgresConnected) {
      const loans = await prisma.loan.findMany({
        where: { userId },
        include: { repayments: true },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const enrichedLoans = loans.map((loan) => {
        const totalRepaid = loan.repayments.reduce(
          (sum, r) => sum + parseFloat(r.amount.toString()),
          0
        );
        const originalAmount = parseFloat(loan.amount.toString());
        const outstanding = Math.max(0, originalAmount - totalRepaid);

        let dynamicStatus = loan.status;
        if (outstanding <= 0.001) {
          dynamicStatus = 'REPAID';
        } else if (new Date(loan.dueDate) < now) {
          dynamicStatus = 'OVERDUE';
        } else {
          dynamicStatus = 'PENDING';
        }

        return {
          id: loan.id,
          friendName: loan.friendName,
          amount: originalAmount,
          totalRepaid,
          outstanding,
          dueDate: loan.dueDate,
          notes: loan.notes,
          status: dynamicStatus,
          createdAt: loan.createdAt,
        };
      });

      res.json(enrichedLoans);
    } else {
      const loans = memoryStore.loans.filter((l) => l.userId === userId);
      const now = new Date();

      const enrichedLoans = loans.map((loan) => {
        const repayments = memoryStore.repayments.filter((r) => r.loanId === loan.id);
        const totalRepaid = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const originalAmount = parseFloat(loan.amount);
        const outstanding = Math.max(0, originalAmount - totalRepaid);

        let dynamicStatus = loan.status;
        if (outstanding <= 0.001) {
          dynamicStatus = 'REPAID';
        } else if (new Date(loan.dueDate) < now) {
          dynamicStatus = 'OVERDUE';
        } else {
          dynamicStatus = 'PENDING';
        }

        return {
          id: loan.id,
          friendName: loan.friendName,
          amount: originalAmount,
          totalRepaid,
          outstanding,
          dueDate: loan.dueDate,
          notes: loan.notes,
          status: dynamicStatus,
          createdAt: loan.createdAt,
        };
      });

      enrichedLoans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      res.json(enrichedLoans);
    }
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

/**
 * POST /api/loans
 * Create a new loan record for a friend.
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { friendName, amount, dueDate, notes } = req.body;

    if (!friendName || typeof friendName !== 'string' || friendName.trim().length === 0) {
      res.status(400).json({ error: "Friend's name is required" });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Loan amount must be a positive number' });
      return;
    }

    if (!dueDate) {
      res.status(400).json({ error: 'Due date is required' });
      return;
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      res.status(400).json({ error: 'Invalid due date format' });
      return;
    }

    if (dbState.isPostgresConnected) {
      const newLoan = await prisma.loan.create({
        data: {
          userId,
          friendName: friendName.trim(),
          amount: new Prisma.Decimal(toDecimalString(numAmount)),
          dueDate: parsedDueDate,
          notes: notes ? notes.trim() : null,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        id: newLoan.id,
        friendName: newLoan.friendName,
        amount: parseFloat(newLoan.amount.toString()),
        dueDate: newLoan.dueDate,
        notes: newLoan.notes,
        status: newLoan.status,
        createdAt: newLoan.createdAt,
      });
    } else {
      const newLoan: MemoryLoan = {
        id: 'loan_' + Math.random().toString(36).substring(2, 9),
        userId,
        friendName: friendName.trim(),
        amount: toDecimalString(numAmount),
        dueDate: parsedDueDate,
        notes: notes ? notes.trim() : null,
        status: 'PENDING',
        createdAt: new Date(),
      };
      memoryStore.loans.push(newLoan);

      res.status(201).json({
        id: newLoan.id,
        friendName: newLoan.friendName,
        amount: parseFloat(newLoan.amount),
        dueDate: newLoan.dueDate,
        notes: newLoan.notes,
        status: newLoan.status,
        createdAt: newLoan.createdAt,
      });
    }
  } catch (err) {
    console.error('Error creating loan:', err);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

/**
 * GET /api/loans/:id
 * Retrieve details of a specific loan with full repayment history.
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    if (dbState.isPostgresConnected) {
      const loan = await prisma.loan.findFirst({
        where: { id, userId },
        include: {
          repayments: {
            orderBy: { repaidAt: 'desc' },
          },
        },
      });

      if (!loan) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      const totalRepaid = loan.repayments.reduce(
        (sum, r) => sum + parseFloat(r.amount.toString()),
        0
      );
      const originalAmount = parseFloat(loan.amount.toString());
      const outstanding = Math.max(0, originalAmount - totalRepaid);

      let dynamicStatus = loan.status;
      if (outstanding <= 0.001) {
        dynamicStatus = 'REPAID';
      } else if (new Date(loan.dueDate) < new Date()) {
        dynamicStatus = 'OVERDUE';
      } else {
        dynamicStatus = 'PENDING';
      }

      res.json({
        id: loan.id,
        friendName: loan.friendName,
        amount: originalAmount,
        totalRepaid,
        outstanding,
        dueDate: loan.dueDate,
        notes: loan.notes,
        status: dynamicStatus,
        createdAt: loan.createdAt,
        repayments: loan.repayments.map((r) => ({
          id: r.id,
          amount: parseFloat(r.amount.toString()),
          repaidAt: r.repaidAt,
        })),
      });
    } else {
      const loan = memoryStore.loans.find((l) => l.id === id && l.userId === userId);
      if (!loan) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      const repayments = memoryStore.repayments
        .filter((r) => r.loanId === loan.id)
        .sort((a, b) => b.repaidAt.getTime() - a.repaidAt.getTime());

      const totalRepaid = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const originalAmount = parseFloat(loan.amount);
      const outstanding = Math.max(0, originalAmount - totalRepaid);

      let dynamicStatus = loan.status;
      if (outstanding <= 0.001) {
        dynamicStatus = 'REPAID';
      } else if (new Date(loan.dueDate) < new Date()) {
        dynamicStatus = 'OVERDUE';
      } else {
        dynamicStatus = 'PENDING';
      }

      res.json({
        id: loan.id,
        friendName: loan.friendName,
        amount: originalAmount,
        totalRepaid,
        outstanding,
        dueDate: loan.dueDate,
        notes: loan.notes,
        status: dynamicStatus,
        createdAt: loan.createdAt,
        repayments: repayments.map((r) => ({
          id: r.id,
          amount: parseFloat(r.amount),
          repaidAt: r.repaidAt,
        })),
      });
    }
  } catch (err) {
    console.error('Error fetching loan details:', err);
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
});

/**
 * POST /api/loans/:id/repayments
 * Record a partial or full repayment for a loan.
 * Prevents repayments greater than outstanding balance.
 */
router.post('/:id/repayments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Repayment amount must be a positive number' });
      return;
    }

    if (dbState.isPostgresConnected) {
      const loan = await prisma.loan.findFirst({
        where: { id, userId },
        include: { repayments: true },
      });

      if (!loan) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      const totalRepaid = loan.repayments.reduce(
        (sum, r) => sum + parseFloat(r.amount.toString()),
        0
      );
      const originalAmount = parseFloat(loan.amount.toString());
      const outstanding = Math.max(0, originalAmount - totalRepaid);

      if (outstanding <= 0.001) {
        res.status(400).json({ error: 'This loan is already fully repaid' });
        return;
      }

      // Prevent repayments greater than the outstanding balance
      if (numAmount > outstanding + 0.001) {
        res.status(400).json({
          error: `Repayment amount (₹${numAmount.toFixed(2)}) cannot exceed outstanding balance (₹${outstanding.toFixed(2)})`,
        });
        return;
      }

      const repayment = await prisma.repayment.create({
        data: {
          loanId: loan.id,
          amount: new Prisma.Decimal(toDecimalString(numAmount)),
        },
      });

      const newOutstanding = Math.max(0, outstanding - numAmount);
      if (newOutstanding <= 0.001) {
        await prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'REPAID' },
        });
      }

      res.status(201).json({
        success: true,
        repayment: {
          id: repayment.id,
          amount: parseFloat(repayment.amount.toString()),
          repaidAt: repayment.repaidAt,
        },
        outstanding: newOutstanding,
        status: newOutstanding <= 0.001 ? 'REPAID' : loan.status,
      });
    } else {
      const loan = memoryStore.loans.find((l) => l.id === id && l.userId === userId);
      if (!loan) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      const repayments = memoryStore.repayments.filter((r) => r.loanId === loan.id);
      const totalRepaid = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const originalAmount = parseFloat(loan.amount);
      const outstanding = Math.max(0, originalAmount - totalRepaid);

      if (outstanding <= 0.001) {
        res.status(400).json({ error: 'This loan is already fully repaid' });
        return;
      }

      if (numAmount > outstanding + 0.001) {
        res.status(400).json({
          error: `Repayment amount (₹${numAmount.toFixed(2)}) cannot exceed outstanding balance (₹${outstanding.toFixed(2)})`,
        });
        return;
      }

      const repayment: MemoryRepayment = {
        id: 'rep_' + Math.random().toString(36).substring(2, 9),
        loanId: loan.id,
        amount: toDecimalString(numAmount),
        repaidAt: new Date(),
      };
      memoryStore.repayments.push(repayment);

      const newOutstanding = Math.max(0, outstanding - numAmount);
      if (newOutstanding <= 0.001) {
        loan.status = 'REPAID';
      }

      res.status(201).json({
        success: true,
        repayment: {
          id: repayment.id,
          amount: parseFloat(repayment.amount),
          repaidAt: repayment.repaidAt,
        },
        outstanding: newOutstanding,
        status: newOutstanding <= 0.001 ? 'REPAID' : loan.status,
      });
    }
  } catch (err) {
    console.error('Error recording repayment:', err);
    res.status(500).json({ error: 'Failed to record repayment' });
  }
});

export default router;
