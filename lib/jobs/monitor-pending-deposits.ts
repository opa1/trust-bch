import { prisma } from "@/lib/db/prisma";
import { EscrowStatus } from "@prisma/client";
import { getAddressBalance } from "@/server/blockchain/bch";
import { transitionEscrow } from "@/services/escrow.service";

/**
 * BACKGROUND JOB: Monitor Pending Deposits
 *
 * Purpose: Polls escrows that are in FUNDING_IN_PROGRESS state and checks if funds have arrived.
 * This acts as a safety net for the synchronous `fundEscrowFromUserWallet` verification.
 *
 * Usage: Should be called by a cron job (e.g., every 30-60 seconds).
 */
export async function monitorPendingDeposits() {
  console.log("[Job] Starting pending deposit monitor...");

  const pendingEscrows = await prisma.escrow.findMany({
    where: { status: EscrowStatus.FUNDING_IN_PROGRESS },
  });

  console.log(`[Job] Found ${pendingEscrows.length} pending funding escrows.`);

  for (const escrow of pendingEscrows) {
    try {
      // Check balance
      const balance = await getAddressBalance(escrow.escrowAddress);

      // If we see funds >= amount, transition to FUNDED
      // We check total balance to support 0-conf
      if (balance.balance >= escrow.amountBCH) {
        console.log(`[Job] Escrow ${escrow.id} funded! Transitioning...`);

        await transitionEscrow(
          escrow.id,
          EscrowStatus.FUNDED,
          undefined, // System triggered
          {
            method: "monitorPendingDeposits",
            balance: balance.balance,
            confirmed: balance.confirmed,
          },
        );
      }
    } catch (error) {
      console.error(`[Job] Error checking escrow ${escrow.id}:`, error);
    }
  }
}
