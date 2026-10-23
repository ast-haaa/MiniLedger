# MiniLedger 💳

**MiniLedger** is a simple, fully functional mobile app built to track money lent to friends. Designed with beginner-friendly, clean TypeScript code that is intuitive, robust, and easy to explain in a technical interview.

---

## 📱 Tech Stack

- **Mobile App**: React Native, Expo, TypeScript
- **Backend API**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM (stores monetary amounts using PostgreSQL `DECIMAL(12, 2)`)
- **API Client**: Axios with AsyncStorage authentication interceptor

---

## 🗂 Project Structure

Clean and minimal file layout with zero unnecessary abstractions:

```text
miniledger/
├── mobile/
│   ├── app/
│   │   ├── index.tsx                  # Login screen (Phone & 6-digit mock OTP)
│   │   ├── dashboard.tsx              # 4 Summary cards & loan list with overdue highlights
│   │   ├── add-loan.tsx               # Add loan form with quick due date presets
│   │   └── loan-details.tsx           # Breakdown, partial/full repayments, overpayment prevention
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces & models
│   │   └── api.ts                     # Axios client & typed API service
│   ├── index.tsx                      # App root router & entry point
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                  # Prisma client & resilient fallback in-memory store
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts     # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # /api/auth routes (send-otp, verify-otp)
│   │   │   ├── loan.routes.ts         # /api/loans routes (CRUD, repayments)
│   │   │   └── summary.routes.ts      # /api/summary calculations
│   │   ├── utils/
│   │   │   ├── auth.ts                # Mock OTP, hashing, JWT signing
│   │   │   └── formatters.ts          # Currency & decimal formatters
│   │   ├── types/
│   │   │   └── index.ts               # Request, storage, and entity types
│   │   ├── tests/
│   │   │   └── api.test.ts            # 14 automated Jest tests
│   │   ├── app.ts                     # Express app configuration & route mounting
│   │   ├── auth.ts                    # Backwards-compatible auth exports
│   │   └── index.ts                   # Server bootstrap & lifecycle manager
│   ├── prisma/
│   │   └── schema.prisma              # Database models (User, Loan, Repayment, OtpVerification)
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml                 # Optional 1-command PostgreSQL container
├── README.md
└── .gitignore
```

---

## ⚙️ Prerequisites & Required Software

- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **yarn**
- **Expo Go** app (on your iOS/Android phone) or an Android Emulator / Web browser
- *(Optional)* **Docker Desktop** (if you want to run PostgreSQL via Docker)

---

## 🗄 PostgreSQL Configuration & Migrations

### 1. Start PostgreSQL (Option A: Docker)
Run the pre-configured Postgres container:
```bash
docker compose up -d
```
*(Default credentials: user `postgres`, password `postgres`, port `5432`, database `miniledger`)*

### 2. Run Database Migrations
Inside the `server/` directory:
```bash
cd server
npx prisma migrate dev --name init
```

> **Note on Database Resilience**: If PostgreSQL is not active, the backend automatically runs in resilient in-memory mode, so you can test all features and APIs immediately without any setup hurdles!

---

## 🔐 Environment Variables

The server uses the following `.env` settings (`server/.env`):

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/miniledger?schema=public"
JWT_SECRET=miniledger_jwt_secret_key_2026
```

A template is provided in `server/.env.example`.

---

## 🚀 Running the Application

### Step 1: Start the Backend Server

```bash
cd server
npm install
npm run dev
```
Server starts on `http://localhost:5000`.

### Step 2: Start the Mobile App

In a new terminal:
```bash
cd mobile
npm install
npx expo start
```
- Press **`w`** in the terminal to open the app directly in your web browser!
- Press **`a`** to open in an Android Emulator.
- Scan the QR code using the **Expo Go** app on your physical iPhone or Android.

---

## 🧪 Testing the Mock OTP Flow

1. Open the app on the **Sign In** screen.
2. Enter any valid phone number (e.g., `9876543210` or `+919876543210`).
3. Tap **"Send OTP"**.
4. Check your **server terminal console** — you will see a prominent banner:
   ```text
   ========================================
   [MOCK OTP] Phone: 9876543210 | Code: 123456
   ========================================
   ```
   *(For testing convenience, the mock OTP is also displayed in a friendly banner on the screen with a "Tap to auto-fill" button!)*
5. Tap or enter the 6-digit code and press **"Verify & Continue"**.
6. The app verifies the OTP against its SHA-256 hash, creates your user profile if new, and stores the JWT securely in `AsyncStorage`.

---

## 📊 Summary Calculations & Business Rules

All numbers are calculated from database records:

- **Total Lent**: Sum of all original loan amounts.
- **Total Repaid**: Sum of all recorded repayment amounts.
- **Outstanding**: `Total Lent - Total Repaid`.
- **Overdue**: Outstanding balance of loans whose due dates have passed and which are not fully settled (`status !== 'REPAID'`).
- **Repayment Validation**: The API prevents recording any repayment greater than the current outstanding balance.
- **Dynamic Status**: When outstanding balance reaches `0`, the loan is automatically marked as `REPAID`.

---

## 🔬 Running Automated Tests

A comprehensive suite of 14 tests is included covering:
- Mock OTP generation and attempt limiting (max 5 attempts)
- SHA-256 hashed OTP verification and JWT token issuance
- Unauthorized request rejection (401)
- Loan creation and validation
- Repayment validation (rejecting overpayments > outstanding balance)
- Exact mathematical calculation of Total Lent, Repaid, Outstanding, and Overdue

Run the tests inside `server/`:
```bash
cd server
npm test
```
Result: **14 passed, 14 total**.
