export interface User {
  id: string;
  phoneNumber: string;
}

export interface Loan {
  id: string;
  friendName: string;
  amount: number;
  totalRepaid: number;
  outstanding: number;
  dueDate: string;
  notes?: string | null;
  status: 'PENDING' | 'OVERDUE' | 'REPAID' | string;
  createdAt: string;
}

export interface Repayment {
  id: string;
  amount: number;
  repaidAt: string;
}

export interface LoanDetail extends Loan {
  repayments: Repayment[];
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdue: number;
  totalLoans: number;
}

export type Screen = 'login' | 'dashboard' | 'add-loan' | 'loan-details';
