/**
 * Application configuration
 * Centralized environment variable access
 */

export const config = {
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // Bitcoin Cash
  bch: {
    network: (process.env.BCH_NETWORK as "testnet" | "mainnet") || "mainnet",
    apiUrl: process.env.BCH_API_URL || "https://api.fullstack.cash/v5",
  },

  // Encryption
  encryption: {
    walletKey: process.env.WALLET_ENCRYPTION_KEY || "",
  },

  // Escrow settings
  escrow: {
    defaultExpiryHours: parseInt(
      process.env.DEFAULT_ESCROW_EXPIRY_HOURS || "1",
    ),
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "1"),
    // Standard miner fee buffer (2000 sats) to cover release transaction
    minerFeeBuffer: 0.00002,
  },

  // Environment
  env: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  },
} as const;
