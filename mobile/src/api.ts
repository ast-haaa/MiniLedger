import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, Loan, LoanDetail, Repayment, Summary } from './types';

// Re-export types for convenience
export * from './types';

// In Android emulator localhost is 10.0.2.2, on web/iOS it is localhost
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const TOKEN_KEY = '@miniledger_token';
const USER_KEY = '@miniledger_user';

// Automatically inject JWT token into requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error reading token from storage:', error);
  }
  return config;
});

// ==========================================
// AUTH API
// ==========================================

export async function sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
  const response = await api.post('/api/auth/send-otp', { phoneNumber });
  return response.data;
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string; user: User }> {
  const response = await api.post('/api/auth/verify-otp', { phoneNumber, otp });
  const { token, user } = response.data;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return { token, user };
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return Boolean(token);
}

// ==========================================
// LOANS API
// ==========================================

export async function fetchSummary(): Promise<Summary> {
  const response = await api.get('/api/summary');
  return response.data;
}

export async function fetchLoans(): Promise<Loan[]> {
  const response = await api.get('/api/loans');
  return response.data;
}

export async function fetchLoanDetails(id: string): Promise<LoanDetail> {
  const response = await api.get(`/api/loans/${id}`);
  return response.data;
}

export async function createLoan(loanData: {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
}): Promise<Loan> {
  const response = await api.post('/api/loans', loanData);
  return response.data;
}

export async function recordRepayment(
  loanId: string,
  amount: number
): Promise<{ success: boolean; outstanding: number; status: string; repayment: Repayment }> {
  const response = await api.post(`/api/loans/${loanId}/repayments`, { amount });
  return response.data;
}

export default api;
