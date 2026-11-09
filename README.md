# MONTRA — Personal Finance & Shared Expense Management

**MONTRA** is a modern, minimalistic, secure personal finance mobile application built with **React Native**, **Expo SDK 58**, **TypeScript**, **Supabase**, and **Zustand**. It combines personal budgeting, monthly salary tracking, and Splitwise-style expense sharing with bank-grade PostgreSQL Row Level Security (RLS).

---

## 🌟 Key Features

### 1. Financial Dashboard
- **Total Balance Overview**: Real-time balance computed across all bank, cash, and wallet accounts.
- **Monthly Income vs Expenses**: Current month cash flow with net savings and savings rate percentage.
- **Salary Tracking**: Tracks monthly salary, credit arrival date, remaining cash, and additional income.
- **Timeframe Expense Breakdown**: Today's, this week's, and this month's spending.
- **Interactive Analytics**: SVG-powered financial bar charts and category distribution without third-party native crashes.
- **Quick Action Bar**: 1-tap modal triggers for Adding Expenses, Recording Income, Transferring Funds, and Splitting Bills.

### 2. Transaction Management
- Comprehensive multi-account transactions: Income, Expenses, and Account Transfers.
- Full filtering by Transaction Type, Category, and live text search.
- Safe integer minor-unit arithmetic (paise / cents) preventing floating-point rounding errors.
- Automatic account balance synchronization upon creation, edit, or deletion.
- Locale-aware currency formatting with INR (`₹`) Indian numbering system as default, plus USD (`$`), EUR (`€`), and GBP (`£`).
- CSV Export with native device sharing (`expo-sharing` & `expo-file-system`).

### 3. Salary & Budget Management
- **Monthly Salary Planning**: Set take-home pay and arrival date.
- **Smart 50/30/20 Blueprint**: Auto-suggested allocation across Rent, Food, Transportation, Savings, Investments, and Shopping.
- **Monthly & Category Budgets**: Category spending caps with real-time progress indicators.
- **Budget Warning States**: Automatic status indicators:
  - 🟢 **On Track** (< 80%)
  - 🟡 **Warning / Approaching** (80% - 99%)
  - 🔴 **Exceeded** (≥ 100%)

### 4. Splitwise-Style Expense Sharing
- **Group Management**: Create shared groups (Trips, Apartments, Household, Events) and add members.
- **Flexible Split Methods**:
  - **Equally**: Divides cost among participants and fair integer-remainder distribution.
  - **Exact Amounts**: Custom amounts per member.
  - **Percentage**: Validated percentage splits.
  - **Shares**: Weighted shares per person.
- **Min-Cash-Flow Simplification**: Computes who owes whom with the minimal number of debt settlement transactions.
- **Debt Settlements**: Record payments (UPI, NetBanking, Cash) and auto-recalibrate group balances.

### 5. Savings & Financial Goals
- Create target savings goals (Emergency Fund, Vacation, Gadgets).
- Record deposit and withdrawal contributions with dates and notes.
- Visual goal progress percentages and achievement celebrations.

### 6. Authentication & Security
- Complete Supabase authentication: Email registration, secure login, password reset flow.
- Token persistence in device keychain via `expo-secure-store`.
- Strict PostgreSQL Row Level Security (RLS) ensuring isolated tenant data.
- Input validation using Zod and React Hook Form.

### 7. Design System & Theming
- Centralized Fintech Design Tokens.
- **Dark Theme**: `#0B0F14` background, `#121923` surface, `#A3E635` primary lime, `#38BDF8` secondary blue.
- **Light Theme**: `#F7F9FC` background, `#FFFFFF` surface, `#4D7C0F` primary olive, `#0284C7` secondary sky.
- Automatic system theme detection and manual switching with persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Mobile Core** | React Native 0.88, Expo SDK 58, Expo Router, TypeScript |
| **State Management** | Zustand, TanStack Query |
| **Backend & DB** | Supabase, PostgreSQL, Row Level Security (RLS) |
| **Forms & Validation** | React Hook Form, Zod, `@hookform/resolvers` |
| **Icons & Charts** | Lucide React Native, React Native SVG |
| **Device Capabilities**| Expo SecureStore, Expo Notifications, Expo FileSystem, Expo Sharing |
| **Testing** | Jest, Jest-Expo |

---

## 📁 Project Architecture

```
MONTRA/
├── src/
│   ├── app/                    # Expo Router file-based screens
│   │   ├── (auth)/             # Welcome, Login, Register, Forgot Password, Reset Password
│   │   ├── (tabs)/             # Home, Transactions, Budgets, Split, Profile
│   │   ├── transactions/       # Add Transaction, Transaction Detail [id]
│   │   ├── budgets/            # Add Budget & Category Allocations
│   │   ├── goals/              # Add Goal, Goal Details [id] & Contributions
│   │   ├── split/              # Create Group, Group Details [id], Add Expense, Settle
│   │   ├── analytics/          # Multi-timeframe Financial Analytics & CSV Export
│   │   ├── settings/           # Salary Setup, 50/30/20 Allocations, Account Manager
│   │   ├── _layout.tsx         # Global Providers, Navigation Stack & Status Bar
│   │   └── index.tsx           # Auth State Dispatcher
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card, Badge, Typography, Header, EmptyState
│   │   └── charts/             # MonthlyBarChart, CategoryProgressRow (React Native SVG)
│   ├── features/               # Modular business logic
│   ├── services/               # Supabase API services (Auth, Txn, Budget, Split, Savings, Dashboard)
│   ├── store/                  # Zustand stores (AuthStore, ThemeStore)
│   ├── theme/                  # Design tokens, colors (Dark & Light)
│   ├── types/                  # Database schema and domain interfaces
│   └── utils/                  # Currency formatting, Minor unit math, Splitwise engine, CSV Export
├── supabase/
│   └── migrations/             # Complete PostgreSQL DDL schema & RLS policies
├── tests/                      # Automated Jest test suites (Currency, SplitEngine, Validation, Calculations)
├── .env.example                # Environment variable blueprint
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or bun

### 2. Installation
```bash
git clone <repo-url>
cd MONTRA
npm install
```

### 3. Supabase Database Setup
1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and run the contents of [`supabase/migrations/20261109000000_montra_schema.sql`](./supabase/migrations/20261109000000_montra_schema.sql).
   - This sets up tables, foreign keys, cascade rules, system seed categories, triggers, and Row Level Security policies.
4. Copy your **Project URL** and **anon public key** from Project Settings > API.

### 4. Configure Environment
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Application
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on Web browser
npm run web
```

---

## 🧪 Automated Testing

MONTRA includes 32 automated tests covering financial arithmetic, Splitwise split mechanics, Zod validation, and allocation algorithms:

```bash
# Run Jest test suites
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run ESLint
npm run lint
```

### Test Coverage Highlights
- **Minor-Unit Arithmetic**: Floating-point rounding protection (e.g. 0.1 + 0.2 = 30 paise).
- **Splitwise Remainder Distribution**: Even distribution of remainder 1-paise units among participants so total shares always sum to 100.00% without pennies vanishing.
- **Min-Cash-Flow Algorithm**: Greedy settlement calculator that reduces debts into minimal transfers.
- **Fintech Input Guards**: Rejection of negative amounts, zero budgets, short passwords, and mismatched confirmation fields.

---

## 🔒 Security Best Practices
- **No Service-Role Key Exposed**: The client only communicates through Supabase public anon keys.
- **Row Level Security (RLS)**: Enforced directly on PostgreSQL for all tables. Users cannot read, query, or mutate records belonging to other users.
- **Encrypted Local Storage**: Authentication JWT tokens are stored securely in the hardware-backed keystore using `expo-secure-store`.

---

## 📄 License
MIT
