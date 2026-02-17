import { NextRequest, NextResponse } from "next/server";
import { EscrowStatus } from "@prisma/client";
import * as escrowService from "@/services/escrow.service";
import { generateEncryptedWallet } from "@/server/blockchain/wallet";
import { generateId } from "@/lib/utils/id";
import { prisma } from "@/lib/db/prisma";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  // Set a mock encryption key if not present (32 bytes hex or string)
  if (!process.env.WALLET_ENCRYPTION_KEY) {
    // 32 chars
    process.env.WALLET_ENCRYPTION_KEY = "12345678901234567890123456789012";
  }

  const log: string[] = [];
  const logFile = path.join(process.cwd(), "verification.log");

  // Ensure log file is empty
  try {
    fs.writeFileSync(logFile, "");
  } catch (e) {}

  function print(msg: string) {
    console.log(msg);
    log.push(msg);
    try {
      fs.appendFileSync(logFile, msg + "\n");
    } catch (e) {
      // ignore
    }
  }

  // Track created IDs for cleanup
  let escrowId: string | undefined;
  let buyerId: string | undefined;
  let sellerId: string | undefined;

  try {
    print("🚀 Starting Escrow Flow Verification (API Route)");

    // 1. Setup Users
    print("👤 Creating Test Users...");
    buyerId = generateId();
    sellerId = generateId();

    // Generate wallets - no arguments needed
    const buyerWallet = await generateEncryptedWallet();
    const sellerWallet = await generateEncryptedWallet();

    const buyer = await prisma.user.create({
      data: {
        id: buyerId,
        email: `buyer_${buyerId}@test.com`.toLowerCase(),
        fullName: "Test Buyer",
        passwordHash: "mock_hash",
        walletAddress: buyerWallet.address,
        privateKeyEncrypted: buyerWallet.encryptedPrivateKey,
      },
    });

    const seller = await prisma.user.create({
      data: {
        id: sellerId,
        email: `seller_${sellerId}@test.com`.toLowerCase(),
        fullName: "Test Seller",
        passwordHash: "mock_hash",
        walletAddress: sellerWallet.address,
        privateKeyEncrypted: sellerWallet.encryptedPrivateKey,
      },
    });

    print(`   ✅ Buyer: ${buyer.email} (${buyer.id})`);
    print(`   ✅ Seller: ${seller.email} (${seller.id})`);

    // 2. Create Escrow
    print("📝 Creating Escrow...");
    // FIXED: Call with individual arguments
    const result = await escrowService.createEscrow(
      buyer.email,
      seller.email,
      0.01,
      "Test Escrow Flow",
      24,
    );
    const escrow = result.escrow;
    escrowId = escrow.id;

    print(
      `   ✅ Escrow Created: ${escrow.escrowId} (Status: ${escrow.status})`,
    );

    // 3. Fund Escrow
    print("💰 Funding Escrow...");
    const fundedEscrow = await escrowService.fundEscrowFromWallet(
      escrow.escrowId,
      buyer.id,
    );
    print(`   ✅ Escrow Funded. Transaction ID: ${fundedEscrow.escrowId}`);
    print(`   Current Status: ${fundedEscrow.status}`);

    if (fundedEscrow.status !== "FUNDED") {
      throw new Error(`Expected FUNDED status, got ${fundedEscrow.status}`);
    }

    // 4. Start Work
    print("🔨 Starting Work...");
    const workingEscrow = await escrowService.startEscrowWork(
      escrow.escrowId,
      seller.id,
    );
    print(`   ✅ Work Started. Status: ${workingEscrow.status}`);

    if (workingEscrow.status !== "IN_PROGRESS") {
      throw new Error(
        `Expected IN_PROGRESS status, got ${workingEscrow.status}`,
      );
    }

    // 5. Submit Work
    print("📤 Submitting Work...");
    const submittedEscrow = await escrowService.submitEscrowWork(
      escrow.escrowId,
      seller.id,
      "Work is done via API verification!",
    );
    print(`   ✅ Work Submitted. Status: ${submittedEscrow.status}`);

    if (submittedEscrow.status !== "SUBMITTED") {
      throw new Error(
        `Expected SUBMITTED status, got ${submittedEscrow.status}`,
      );
    }

    // 6. Release Funds
    print("💸 Releasing Funds...");
    const releasedEscrow = await escrowService.releaseEscrow(
      escrow.escrowId,
      buyer.id,
    );
    print(`   ✅ Funds Released. Status: ${releasedEscrow.status}`);

    // 7. Verify Completion
    if (releasedEscrow.status === EscrowStatus.RELEASED) {
      print("🎉 Flow Complete: SUCCESS");
    } else {
      throw new Error(`Final status mismatch: ${releasedEscrow.status}`);
    }

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    print(`❌ Verification Failed: ${err.message}`);
    console.error(err);
    return NextResponse.json(
      { success: false, log, error: err.message, stack: err.stack },
      { status: 500 },
    );
  } finally {
    // Cleanup
    print("🧹 Cleaning up...");
    if (escrowId)
      await prisma.escrow
        .delete({ where: { id: escrowId } })
        .catch((e) => print(`Cleanup escrow error: ${e.message}`));
    if (buyerId)
      await prisma.user
        .delete({ where: { id: buyerId } })
        .catch((e) => print(`Cleanup buyer error: ${e.message}`));
    if (sellerId) {
      await prisma.user
        .delete({ where: { id: sellerId } })
        .catch((e) => print(`Cleanup seller error: ${e.message}`));
    }

    // Environment restoration no longer needed as we don't mutate it
  }
}
