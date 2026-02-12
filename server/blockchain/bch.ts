import "server-only";
import bchLib from "./bitcore";
import * as client from "./client";
import * as wallet from "./wallet";
import { AppError } from "@/lib/errors/AppError";

/**
 * Re-export wallet types and functions for backward compatibility
 */
export {
  createEscrowWallet,
  decryptPrivateKey,
  encryptPrivateKey,
  generateWallet,
  validateAddress,
} from "./wallet";
export type { BCHWallet, EscrowWallet } from "./wallet";

/**
 * Re-export types from client
 */
export type { AddressBalance, BCHTransaction } from "./client";

/**
 * Gets the balance of a BCH address
 * Delegates to client layer for RPC operation
 *
 * @param address - BCH address to check
 * @returns Address balance information
 */
export async function getAddressBalance(address: string) {
  return client.getAddressBalance(address);
}

/**
 * Gets transaction history for a BCH address
 * Delegates to client layer for RPC operation
 *
 * @param address - BCH address to check
 * @returns Array of transactions
 */
export async function getAddressTransactions(address: string) {
  return client.getAddressTransactions(address);
}

/**
 * Gets details of a specific transaction
 * Delegates to client layer for RPC operation
 *
 * @param txid - Transaction ID
 * @returns Transaction details or null if not found
 */
export async function getTransactionDetails(txid: string) {
  return client.getTransactionDetails(txid);
}

/**
 * Broadcasts a signed raw transaction to the BCH network
 * Delegates to client layer for RPC operation
 *
 * @param rawTxHex - Raw transaction in hex format
 * @returns Transaction ID
 */
export async function broadcastTransaction(rawTxHex: string) {
  return client.broadcastTransaction(rawTxHex);
}

/**
 * Creates and signs a BCH transaction
 * Uses client layer for UTXO fetching, wallet layer for signing
 *
 * @param fromAddress - Source address
 * @param toAddress - Destination address
 * @param amount - Amount in BCH
 * @param privateKeyWIF - Private key in WIF format
 * @returns Signed raw transaction hex
 */
export async function createTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  privateKeyWIF: string,
): Promise<string> {
  try {
    // Get UTXOs from client layer (RPC operation)
    const utxos = await client.getAddressUtxos(fromAddress);

    if (!utxos || utxos.length === 0) {
      throw new AppError("INSUFFICIENT_FUNDS", {
        message: "No UTXOs available",
      });
    }

    // Create transaction object
    const privateKey = new bchLib.PrivateKey(privateKeyWIF);
    const transaction = new bchLib.Transaction();

    let totalInput = 0;
    const amountSatoshis = client.bchToSatoshis(amount);

    // Add inputs
    for (const utxo of utxos) {
      transaction.from({
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        script: bchLib.Script.buildPublicKeyHashOut(
          privateKey.toAddress(),
        ).toHex(),
        satoshis: utxo.value,
      });
      totalInput += utxo.value;

      if (totalInput >= amountSatoshis + 1000) break; // 1000 sats for fee
    }

    if (totalInput < amountSatoshis + 1000) {
      console.error(
        `[bch.ts] Insufficient funds for transaction.`,
        `From: ${fromAddress}`,
        `Required: ${amountSatoshis + 1000} (Amount: ${amountSatoshis} + Fee: 1000)`,
        `Available (UTXO Sum): ${totalInput}`,
        `UTXO Count: ${utxos.length}`,
        `UTXOs:`,
        JSON.stringify(utxos),
      );
      throw new AppError("INSUFFICIENT_FUNDS", {
        required: amountSatoshis + 1000,
        available: totalInput,
        utxoCount: utxos.length,
      });
    }

    // Add output
    transaction.to(toAddress, amountSatoshis);

    // Add change output if needed
    const fee = 1000; // Simple fixed fee
    const change = totalInput - amountSatoshis - fee;
    if (change > 546) {
      // Dust limit
      transaction.change(fromAddress);
    }

    // Sign transaction using wallet layer
    wallet.signTransaction(transaction, privateKeyWIF);

    return transaction.serialize();
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("[bch.ts] Transaction creation error:", error);
    throw new AppError("BLOCKCHAIN_ERROR", {
      originalError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
