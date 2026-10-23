import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth.middleware';
import { prisma, dbState, memoryStore } from '../config/db';

const router = Router();

// Protect summary routes with JWT authentication
router.use(authenticate);

/**
 * GET /api/summary
 * Calculates real totals from database records:
 * - Total Lent: Sum of all original loan amounts
 * - Total Repaid: Sum of all recorded repayments
 * - Outstanding: Total Lent minus Total Repaid
 * - Overdue: Outstanding balance of loans whose due dates have passed and which are not fully repaid
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const now = new Date();

    if (dbState.isPostgresConnected) {
      const loans = await prisma.loan.findMany({
        where: { userId },
        include: { repayments: true },
      });

      let totalLent = 0;
      let totalRepaid = 0;
      let overdue = 0;

      for (const loan of loans) {
        const loanAmount = parseFloat(loan.amount.toString());
        const loanRepaid = loan.repayments.reduce(
          (sum, r) => sum + parseFloat(r.amount.toString()),
          0
        );
        const loanOutstanding = Math.max(0, loanAmount - loanRepaid);

        totalLent += loanAmount;
        totalRepaid += loanRepaid;

        // Overdue: due date passed and not fully repaid
        if (new Date(loan.dueDate) < now && loanOutstanding > 0.001) {
          overdue += loanOutstanding;
        }
      }

      const outstanding = Math.max(0, totalLent - totalRepaid);

      res.json({
        totalLent: Math.round(totalLent * 100) / 100,
        totalRepaid: Math.round(totalRepaid * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        overdue: Math.round(overdue * 100) / 100,
        totalLoans: loans.length,
      });
    } else {
      const loans = memoryStore.loans.filter((l) => l.userId === userId);

      let totalLent = 0;
      let totalRepaid = 0;
      let overdue = 0;

      for (const loan of loans) {
        const repayments = memoryStore.repayments.filter((r) => r.loanId === loan.id);
        const loanAmount = parseFloat(loan.amount);
        const loanRepaid = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const loanOutstanding = Math.max(0, loanAmount - loanRepaid);

        totalLent += loanAmount;
        totalRepaid += loanRepaid;

        if (new Date(loan.dueDate) < now && loanOutstanding > 0.001) {
          overdue += loanOutstanding;
        }
      }

      const outstanding = Math.max(0, totalLent - totalRepaid);

      res.json({
        totalLent: Math.round(totalLent * 100) / 100,
        totalRepaid: Math.round(totalRepaid * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        overdue: Math.round(overdue * 100) / 100,
        totalLoans: loans.length,
      });
    }
  } catch (err) {
    console.error('Error calculating summary:', err);
    res.status(500).json({ error: 'Failed to calculate summary' });
  }
});

export default router;
