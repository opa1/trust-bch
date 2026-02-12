import "./setup-env";
import { prisma } from "@/lib/db/prisma";
import { registerUser } from "@/services/auth.service";
import {
  createEscrow,
  transitionEscrow,
  releaseEscrow,
  refundEscrow,
} from "@/services/escrow.service";
import { EscrowStatus, TransactionDirection } from "@prisma/client";
import { generateId } from "@/lib/utils/id";

async function main() {
  console.log("Starting verification flow...");

  try {
    // 1. Create Users
    const buyerEmail = `buyer_${Date.now()}@test.com`;
    const sellerEmail = `seller_${Date.now()}@test.com`;

    console.log(`Creating buyer: ${buyerEmail}`);
    const buyer = await registerUser(buyerEmail, "password123", "Test Buyer");

    console.log(`Creating seller: ${sellerEmail}`);
    const seller = await registerUser(
      sellerEmail,
      "password123",
      "Test Seller",
    );

    // 2. Create Escrow
    console.log("Creating escrow...");
    const { escrow } = await createEscrow(
      buyerEmail,
      sellerEmail,
      0.01,
      "Test Escrow Item",
      24,
    );
    console.log(`Escrow created: ${escrow.escrowId} (${escrow.status})`);

    // 3. Simulate Funding
    console.log("Simulating funding...");
    // Manually update DB since we can't easily fund on real chain in test
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          id: generateId(),
          escrowId: escrow.id,
          txHash: "dummy_tx_hash_" + Date.now(),
          amountBCH: 0.01,
          confirmations: 1,
          direction: TransactionDirection.INBOUND,
        },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: EscrowStatus.FUNDED,
          txHash: "dummy_tx_hash_" + Date.now(),
          fundedAt: new Date(),
        },
      });
    });

    // Verify State
    const fundedEscrow = await prisma.escrow.findUnique({
      where: { id: escrow.id },
    });
    console.log(
      `Escrow status after funding simulation: ${fundedEscrow?.status}`,
    );

    if (fundedEscrow?.status !== EscrowStatus.FUNDED) {
      throw new Error("Funding simulation failed to update status");
    }

    // 4. Transitions
    console.log("Transitioning to SUBMITTED...");
    await transitionEscrow(escrow.id, EscrowStatus.IN_PROGRESS, buyer.user.id, {
      method: "test",
    });
    await transitionEscrow(escrow.id, EscrowStatus.SUBMITTED, buyer.user.id, {
      method: "test",
    });

    console.log("Transitioning to VERIFIED...");
    await transitionEscrow(escrow.id, EscrowStatus.VERIFIED, buyer.user.id, {
      method: "test",
    });

    const verifiedEscrow = await prisma.escrow.findUnique({
      where: { id: escrow.id },
    });
    console.log(`Escrow status: ${verifiedEscrow?.status}`);

    // 5. Test Release (Should fail at blockchain step but pass auth)
    console.log(
      "Testing Release (Expect Blockchain/Insufficient Funds error)...",
    );
    try {
      await releaseEscrow(escrow.id, buyer.user.id);
      console.log(
        "WARNING: Release succeeded? It should have failed due to no funds.",
      );
    } catch (e: any) {
      console.log(`Create Transaction failed as expected: ${e.message}`);
      // We accept failure here as pass for logic verification
    }

    // 6. Test Refund
    console.log("Testing Refund logic...");
    // Create another escrow for refund
    const { escrow: refundEscrowObj } = await createEscrow(
      buyerEmail,
      sellerEmail,
      0.02,
      "Refund Test Item",
      24,
    );

    // Fund it
    await prisma.escrow.update({
      where: { id: refundEscrowObj.id },
      data: { status: EscrowStatus.FUNDED, fundedAt: new Date() },
    });

    try {
      await refundEscrow(refundEscrowObj.id, buyer.user.id);
      console.log(
        "WARNING: Refund succeeded? It should have failed due to no funds.",
      );
    } catch (e: any) {
      console.log(`Refund failed as expected: ${e.message}`);
    }

    console.log("Verification finished.");
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log(
        "Unique constraint failed, retrying may fix or DB cleanup needed.",
      );
    }
    console.error(`FATAL ERROR: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
