/**
 * Shared TypeScript type definitions
 */

import { EscrowStatus, TransactionDirection } from "@prisma/client";

/**
 * API Response types
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * User types
 */
export interface UserData {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

export interface AuthResult {
  user: UserData;
  token: string;
}

/**
 * Escrow types
 */
export interface EscrowData {
  id: string;
  escrowId: string;
  buyerUserId: string;
  sellerUserId: string;
  amountBCH: number;
  description: string;
  escrowAddress: string;
  status: EscrowStatus;
  txHash?: string;
  expiresAt?: Date;
  fundedAt?: Date;
  submittedAt?: Date;
  verifiedAt?: Date;
  releasedAt?: Date;
  disputeOpenedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction types
 */
export interface TransactionData {
  id: string;
  escrowId: string;
  txHash: string;
  amountBCH: number;
  confirmations: number;
  direction: TransactionDirection;
  createdAt: Date;
}

/**
 * BCH Wallet types
 */
export interface WalletInfo {
  address: string;
  privateKey: string;
}

export interface AddressBalance {
  confirmed: number;
  unconfirmed: number;
}

export interface AddressTransaction {
  txid: string;
  confirmations: number;
  value: number;
  blockHeight?: number;
}

/**
 * Agent types
 */
export interface Agent {
  id: string;
  name: string;
  email: string;
  reputation: number;
  completedEscrows: number;
  isVerified?: boolean;
}
