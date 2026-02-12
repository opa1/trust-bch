import "server-only";
import { prisma } from "@/lib/db/prisma";
import { EscrowStatus } from "@prisma/client";
import { checkEscrowFunding } from "@/services/escrow.service";

/**
 * Check all pending escrows for funding
 */
async function checkPendingEscrows(): Promise<void> {
  try {
    // Find all pending or awaiting_funding escrows
    const pendingEscrows = await prisma.escrow.findMany({
      where: {
        status: {
          in: [EscrowStatus.PENDING, EscrowStatus.AWAITING_FUNDING],
        },
      },
    });

    console.log(
      `[EscrowWatcher] Checking ${pendingEscrows.length} pending escrows`,
    );

    // Check each escrow for funding
    for (const escrow of pendingEscrows) {
      try {
        const updatedEscrow = await checkEscrowFunding(escrow.escrowId);

        if (updatedEscrow && updatedEscrow.status === EscrowStatus.FUNDED) {
          console.log(
            `[EscrowWatcher] ✓ Escrow ${escrow.escrowId} is now FUNDED`,
          );
        }
      } catch (error) {
        console.error(
          `[EscrowWatcher] Error checking escrow ${escrow.escrowId}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  } catch (error) {
    console.error(
      "[EscrowWatcher] Error in checkPendingEscrows:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * Start the escrow watcher with configurable interval
 *
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Interval ID for stopping the watcher
 */
export function startWatcher(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(
    `[EscrowWatcher] Starting escrow watcher (polling every ${intervalMs}ms)`,
  );

  // Run immediately on start
  checkPendingEscrows();

  // Then run on interval
  const intervalId = setInterval(checkPendingEscrows, intervalMs);

  return intervalId;
}

/**
 * Stop the escrow watcher
 *
 * @param intervalId - Interval ID returned from startWatcher
 */
export function stopWatcher(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log("[EscrowWatcher] Stopped escrow watcher");
}
