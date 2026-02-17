import {
  getAddressBalance,
  getAddressTransactions,
} from "@/server/blockchain/bch";
import { AppError } from "@/lib/errors/AppError";

/**
 * Checks if a specific transaction exists for an address
 * @param address - BCH address to check
 * @param txHash - Transaction hash to look for
 * @returns true if transaction found, false otherwise
 */
export async function checkTransactionExists(
  address: string,
  txHash: string,
): Promise<boolean> {
  try {
    const transactions = await getAddressTransactions(address);
    return transactions.some((tx) => tx.txid === txHash);
  } catch (error) {
    console.warn(
      `[TxMonitor] Failed to check transactions for ${address}:`,
      error,
    );
    return false;
  }
}

/**
 * Waits for a transaction to appear in the blockchain or mempool
 * Polls the escrow address until the transaction is detected
 *
 * @param escrowAddress - The escrow wallet address to monitor
 * @param expectedTxHash - The transaction hash we're waiting for
 * @param expectedAmount - The amount in BCH we expect to receive
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 60000 = 60 seconds)
 * @param pollInterval - How often to check in milliseconds (default: 3000 = 3 seconds)
 * @throws AppError if transaction not detected within maxWaitTime
 * @returns void when transaction is detected
 */
export async function waitForTransactionInMempool(
  escrowAddress: string,
  expectedTxHash: string,
  expectedAmount: number,
  maxWaitTime: number = 60000,
  pollInterval: number = 3000,
): Promise<void> {
  const startTime = Date.now();
  let attempts = 0;

  console.log(
    `[TxMonitor] Starting poll for ${expectedTxHash} on ${escrowAddress}`,
  );

  while (Date.now() - startTime < maxWaitTime) {
    attempts++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // 1. Check if transaction appears in history
    const exists = await checkTransactionExists(escrowAddress, expectedTxHash);

    if (exists) {
      console.log(
        `[TxMonitor] Transaction ${expectedTxHash} detected after ${elapsed}s!`,
      );
      return;
    }

    // 2. Fallback: Check if balance reflects the funding
    // This handles cases where API might not return the TX in list yet but updates balance
    try {
      const balance = await getAddressBalance(escrowAddress);
      // We check total balance (confirmed + unconfirmed)
      if (balance.balance >= expectedAmount) {
        console.log(
          `[TxMonitor] Balance sufficient (${balance.balance} BCH) after ${elapsed}s. Assuming success.`,
        );
        return;
      }
    } catch (error) {
      console.warn(`[TxMonitor] Failed to check balance:`, error);
    }

    console.log(
      `[TxMonitor] Waiting for transaction... ${elapsed}s elapsed. (Attempt ${attempts})`,
    );

    // Wait for next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new AppError("TRANSACTION_TIMEOUT", {
    message: `Transaction ${expectedTxHash} not detected within ${maxWaitTime / 1000} seconds.`,
    txHash: expectedTxHash,
    address: escrowAddress,
  });
}
