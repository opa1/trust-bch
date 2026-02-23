# TrustBCH - Advanced AI-Powered Bitcoin Cash Escrow

TrustBCH is a production-grade micro-escrow platform for the Bitcoin Cash (BCH) ecosystem. It features agentic AI verification, a dynamic seller trust ecosystem, and a robust state-machine-driven lifecycle to ensure secure and trustworthy peer-to-peer transactions.

## 🚀 Key Features

- **Agentic AI Verification**: Automated work validation using Google Gemini, providing instant feedback and confidence scores for submitted work.
- **Dynamic Seller Trust Score**: Sophisticated reputation system incorporating success rates, transaction volume, dispute history, and AI-validated performance metrics.
- **Strict State Machine**: Robust escrow lifecycle management (Created → Funded → Submitted → Verified → Released/Refunded) with exhaustive audit trails.
- **BCH Integration**: Seamless Bitcoin Cash operations including address generation, funding detection, and automated payouts via `bitcore-lib-cash`.
- **Real-time Notifications**: Instant alerts for all critical escrow events (funding, submissions, disputes, releases).

## 🏗️ Technical Architecture

The project is built with **Next.js 16 (App Router)** and follows a clean service-oriented architecture:

```
trustbch/
├── app/               # Next.js App Router (UI & API Routes)
├── components/        # Shared UI components (Radix UI, Shadcn)
├── lib/
│   ├── db/            # Prisma client and database utilities
│   ├── utils/         # Core helpers (BCH, Encryption, Validation)
│   └── validations/   # Zod schemas for type-safe inputs
├── prisma/            # Database schema and migrations
├── services/          # Business logic layers (The core "Brain")
│   ├── ai-verification.service.ts  # Gemini AI analysis logic
│   ├── escrow.service.ts           # Core state machine logic
│   ├── trust-score.service.ts      # Reputation calculation engine
│   └── agent.service.ts            # AI worker communication
└── server/            # Blockchain-specific server logic
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Framer Motion
- **Backend**: Next.js Server Actions & API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI Engine**: Google Gemini (via `@google/generative-ai`)
- **Blockchain**: Bitcoin Cash (`bitcore-lib-cash`)
- **UI Components**: Radix UI, Lucide React, Shadcn/UI
- **State Management**: Zustand
- **Validation**: Zod

## 🔧 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL instance (local or hosted, e.g., Neon)
- Gemini API Key

### Installation

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string.
   - `JWT_SECRET`: Secret for auth tokens.
   - `WALLET_ENCRYPTION_KEY`: AES-256-CBC key for wallet security.
   - `GEMINI_API_KEY`: For AI verification features.
   - `BCH_NETWORK`: `testnet` or `mainnet`.

3. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Launch Development:**
   ```bash
   npm run dev
   ```

## 🔐 Advanced Security

- **Wallet Security**: Private keys are never stored in plain text. They are encrypted at rest using AES-256-CBC with a system-level master key.
- **State Integrity**: Escrow status can only be modified via a central state transition engine that enforces strict lifecycle rules.
- **Audit Trails**: Every state change is logged in the `StateTransition` table, recording the actor, timestamp, and relevant metadata.

## 🤖 AI Verification & Trust Score

TrustBCH differentiates itself with its automated verification layer:

1. **AI Analysis**: Upon work submission, the `AiVerificationService` triggers a Gemini-powered analysis to check if the work matches the requirements.
2. **Confidence Scores**: The AI provides a recommendation (`APPROVE`, `REJECT`, `NEEDS_REVIEW`) and a confidence percentage.
3. **Dynamic Reputation**: The `TrustScoreService` recalculates the seller's score (0-100) after every transaction, factoring in success rate, volume, and AI feedback.

## 📁 Project Layout

- `app/api/escrow`: Endpoints for lifecycle management.
- `app/api/ai-worker`: Callback endpoint for AI verification results.
- `services/escrow.service.ts`: The primary orchestrator for the escrow state machine.
- `lib/db/prisma.ts`: Singleton Prisma client for database operations.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For development issues or questions, contact the project maintainers.
