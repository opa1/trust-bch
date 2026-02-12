# TrustBCH - Bitcoin Cash Micro-Escrow Platform

A production-grade Bitcoin Cash escrow platform built with Next.js, MongoDB, and Bitcoin Cash integration.

## 🏗️ Architecture

This project follows **clean architecture principles** with strict separation of concerns:

```
lib/
├── db/              # Database connection
├── models/          # Mongoose schemas
├── services/        # Business logic (reusable, testable)
├── utils/           # Helper functions
    ├── hash.ts      # Password hashing
    ├── jwt.ts       # Token management
    ├── validators.ts # Zod schemas
    └── responses.ts # API response formatters

app/api/
├── auth/            # Authentication endpoints
├── escrow/          # Escrow management endpoints
└── webhook/         # Blockchain webhooks
```

**Key Principles:**
- ✅ **No business logic in route handlers** - All logic in services
- ✅ **Reusable functions** - Services can be called from anywhere
- ✅ **Comprehensive error handling** - Every async operation wrapped
- ✅ **Type safety** - Full TypeScript coverage with Zod validation
- ✅ **No hard-coded values** - All config in environment variables

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Password Hashing:** bcrypt
- **Blockchain:** Bitcoin Cash (bitcore-lib-cash)
- **API Client:** Axios

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- BCH testnet/mainnet access

## 🔧 Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT (min 32 chars)
- `WALLET_ENCRYPTION_KEY` - Key for encrypting private keys (min 32 chars)
- `BCH_NETWORK` - `testnet` or `mainnet`

3. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

#### **POST** `/api/auth/signup`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-02-05T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### **POST** `/api/auth/login`
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Escrow Management

All escrow endpoints require authentication. Include JWT token in header:
```
Authorization: Bearer <your_token>
```

#### **POST** `/api/escrow/create`
Create a new escrow transaction.

**Request:**
```json
{
  "receiverEmail": "receiver@example.com",
  "amount": 0.1,
  "description": "Payment for services rendered",
  "expiryHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "...",
      "senderId": "...",
      "receiverId": "...",
      "amount": 0.1,
      "description": "Payment for services rendered",
      "walletAddress": "bitcoincash:qp...",
      "status": "PENDING",
      "expiresAt": "2026-02-06T...",
      "createdAt": "2026-02-05T..."
    }
  }
}
```

#### **GET** `/api/escrow/status?id=<escrowId>`
Get escrow status and check for funding updates.

**Response:**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "...",
      "sender": { "name": "...", "email": "..." },
      "receiver": { "name": "...", "email": "..." },
      "amount": 0.1,
      "walletAddress": "bitcoincash:qp...",
      "status": "FUNDED",
      "fundedAt": "2026-02-05T...",
      "expiresAt": "2026-02-06T..."
    }
  }
}
```

**Escrow Statuses:**
- `PENDING` - Created, awaiting funding
- `FUNDED` - Payment received on blockchain
- `RELEASED` - Funds sent to receiver
- `REFUNDED` - Funds returned to sender
- `EXPIRED` - Escrow expired without funding

#### **POST** `/api/escrow/release`
Release escrow funds to receiver (sender only).

**Request:**
```json
{
  "id": "<escrowId>"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "...",
      "status": "RELEASED",
      "txHash": "abc123...",
      "completedAt": "2026-02-05T..."
    }
  }
}
```

#### **POST** `/api/escrow/refund`
Refund escrow to sender (sender or receiver if expired).

**Request:**
```json
{
  "id": "<escrowId>"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "...",
      "status": "REFUNDED",
      "txHash": "def456...",
      "completedAt": "2026-02-05T..."
    }
  }
}
```

### Webhooks

#### **POST** `/api/webhook/bch`
Webhook for BCH blockchain notifications (optional).

**Request:**
```json
{
  "address": "bitcoincash:qp...",
  "txHash": "abc123...",
  "confirmations": 1
}
```

## 🔐 Security Features

- **Password Security:** bcrypt hashing with 12 salt rounds
- **Private Key Encryption:** AES-256-CBC encryption for wallet private keys
- **JWT Authentication:** Secure token-based authentication
- **Input Validation:** Zod schema validation on all inputs
- **Authorization Checks:** User-level access control on escrow operations

## 🔄 Escrow Flow

1. **Create Escrow:** Sender creates escrow, receives unique BCH address
2. **Fund Escrow:** Sender sends BCH to the escrow address
3. **Auto-Detection:** System monitors blockchain and updates status to FUNDED
4. **Release/Refund:** 
   - **Release:** Sender releases funds to receiver
   - **Refund:** Sender or receiver (if expired) can refund to sender

## 🧪 Testing

### Manual Testing with curl

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Create Escrow:**
```bash
curl -X POST http://localhost:3000/api/escrow/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "receiverEmail": "receiver@example.com",
    "amount": 0.05,
    "description": "Test escrow",
    "expiryHours": 24
  }'
```

## 📁 Project Structure

```
trustbch/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   └── login/route.ts
│   │   ├── escrow/
│   │   │   ├── create/route.ts
│   │   │   ├── release/route.ts
│   │   │   ├── refund/route.ts
│   │   │   └── status/route.ts
│   │   └── webhook/
│   │       └── bch/route.ts
│   └── page.tsx
├── lib/
│   ├── db/
│   │   └── connect.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Escrow.model.ts
│   │   └── Transaction.model.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── escrow.service.ts
│   │   └── bch.service.ts
│   └── utils/
│       ├── hash.ts
│       ├── jwt.ts
│       ├── validators.ts
│       └── responses.ts
├── .env.example
├── .env.local
└── package.json
```

## ⚠️ Important Notes

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Change `WALLET_ENCRYPTION_KEY` to a strong, random value
- [ ] Set `BCH_NETWORK=mainnet` for production
- [ ] Use MongoDB Atlas or managed MongoDB for production
- [ ] Implement rate limiting on API endpoints
- [ ] Add request logging and monitoring
- [ ] Set up automated backups for MongoDB
- [ ] **CRITICAL:** Securely backup `WALLET_ENCRYPTION_KEY` - losing it means losing access to all funds

### Development vs Production

- **Development:** Uses BCH testnet, no real funds at risk
- **Production:** Uses BCH mainnet, handles real cryptocurrency

Always test thoroughly on testnet before deploying to mainnet!

## 🎯 Next Steps

### Phase 2 Features (Optional Enhancements)
- User wallet management (persistent BCH addresses per user)
- Email notifications (escrow created, funded, released)
- Transaction history endpoint
- Escrow list filtering and pagination
- Multi-signature escrow support
- Dispute resolution system
- Admin dashboard

## 📄 License

This is a private MVP project.

## 🤝 Support

For issues or questions, contact the development team.
