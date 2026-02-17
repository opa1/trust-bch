import { prisma } from "@/lib/db/prisma";
import { EscrowStatus } from "@prisma/client";
import { getAddressBalance } from "@/server/blockchain/bch";
import { transitionEscrow } from "@/services/escrow.service";

/**
 * Background job to recover transactions stuck in FUNDING_IN_PROGRESS
 * Run this every 1-5 minutes
 */
export async function recoverPendingTransactions() {
  console.log("[Recovery Job] Checking for pending funding transactions...");

  const pendingEscrows = await prisma.escrow.findMany({
    where: {
      status: EscrowStatus.FUNDING_IN_PROGRESS,
      txHash: { not: null },
    },
  });

  console.log(`[Recovery Job] Found ${pendingEscrows.length} pending escrows`);

  for (const escrow of pendingEscrows) {
    try {
      console.log(
        `[Recovery Job] Checking escrow ${escrow.id}, tx ${escrow.txHash}`,
      );

      // Check if transaction is visible on blockchain
      const balance = await getAddressBalance(escrow.escrowAddress);

      if (balance.balance >= escrow.amountBCH) {
        console.log(
          `[Recovery Job] ✅ Funds confirmed for escrow ${escrow.id}`,
        );

        // Transition to FUNDED
        await transitionEscrow(
          escrow.id,
          EscrowStatus.FUNDED,
          undefined, // System user
          {
            method: "recoverPendingTransactions",
            txHash: escrow.txHash,
            amountBCH: balance.balance,
            recoveredAt: new Date(),
          },
        );

        console.log(`[Recovery Job] ✅ Escrow ${escrow.id} marked as FUNDED`);
      } else {
        console.log(
          `[Recovery Job] ⏳ Waiting for funds: ${balance.balance} / ${escrow.amountBCH} BCH`,
        );
      }
    } catch (error) {
      console.error(
        `[Recovery Job] ❌ Error processing escrow ${escrow.id}:`,
        error,
      );
    }
  }
}
