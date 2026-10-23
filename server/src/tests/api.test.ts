import request from 'supertest';
import app from '../index';

describe('MiniLedger API Tests', () => {
  const testPhone = '+919876543210';
  let authToken = '';
  let loanId = '';

  // 1. Authentication Tests
  describe('Authentication Flow', () => {
    it('should reject invalid phone numbers', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should send a mock OTP for valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mockOtp).toBeDefined();
      expect(res.body.mockOtp).toHaveLength(6);
    });

    it('should reject incorrect OTP with 400', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid OTP');
    });

    it('should verify correct OTP and return JWT token', async () => {
      // First request OTP
      const otpRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: testPhone });

      const mockOtp = otpRes.body.mockOtp;

      // Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: mockOtp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.user.phoneNumber).toBe(testPhone);

      authToken = verifyRes.body.token;
    });

    it('should reject protected routes without token', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
    });
  });

  // 2. Loan Management Tests
  describe('Loan Management', () => {
    it('should validate loan creation inputs', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ friendName: '', amount: -50, dueDate: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should create a new loan record successfully', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: 5000,
          dueDate: futureDate,
          notes: 'Dinner and movie split',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.friendName).toBe('Rahul Sharma');
      expect(res.body.amount).toBe(5000);
      expect(res.body.status).toBe('PENDING');

      loanId = res.body.id;
    });

    it('should retrieve loans list with calculated fields', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const createdLoan = res.body.find((l: any) => l.id === loanId);
      expect(createdLoan).toBeDefined();
      expect(createdLoan.outstanding).toBe(5000);
      expect(createdLoan.totalRepaid).toBe(0);
    });

    it('should retrieve loan details by ID', async () => {
      const res = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(loanId);
      expect(res.body.repayments).toEqual([]);
    });
  });

  // 3. Repayment Validation Tests
  describe('Repayment Validation', () => {
    it('should prevent repayments greater than outstanding balance', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanId}/repayments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 6000 }); // Outstanding is only 5000

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot exceed outstanding balance');
    });

    it('should record a valid partial repayment', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanId}/repayments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 2000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.outstanding).toBe(3000);
    });

    it('should record full repayment and mark status as REPAID', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanId}/repayments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 3000 }); // Pay remaining 3000

      expect(res.status).toBe(201);
      expect(res.body.outstanding).toBe(0);
      expect(res.body.status).toBe('REPAID');
    });

    it('should reject repayments on already fully repaid loan', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanId}/repayments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already fully repaid');
    });
  });

  // 4. Summary Calculations Tests
  describe('Summary Calculations', () => {
    it('should calculate accurate summary numbers from database records', async () => {
      // Create an overdue loan: past due date
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Aman Verma',
          amount: 2500,
          dueDate: pastDate,
          notes: 'Concert ticket',
        });

      const res = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Total Lent = 5000 (Rahul) + 2500 (Aman) = 7500
      expect(res.body.totalLent).toBe(7500);
      // Total Repaid = 5000 (Rahul) = 5000
      expect(res.body.totalRepaid).toBe(5000);
      // Outstanding = 7500 - 5000 = 2500
      expect(res.body.outstanding).toBe(2500);
      // Overdue = 2500 (Aman is past due and unpaid)
      expect(res.body.overdue).toBe(2500);
    });
  });
});
