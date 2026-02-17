import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateWallet, encryptPrivateKey } from "@/server/blockchain/wallet";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not allowed in production" },
      { status: 403 },
    );
  }

  console.log("🚀 Starting Wallet Migration (API)...");

  try {
    // 1. Find users who are missing wallet information
    const usersWithoutWallet = await prisma.user.findMany({
      where: {
        walletAddress: null,
      },
    });

    const logs: string[] = [];
    logs.push(
      `Found ${usersWithoutWallet.length} users needing wallet migration.`,
    );

    if (usersWithoutWallet.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All users already have wallets. No action needed.",
        logs,
      });
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Iterate and update
    for (const user of usersWithoutWallet) {
      try {
        const wallet = generateWallet();
        const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            walletAddress: wallet.address,
            walletPublicKey: wallet.publicKey,
            privateKeyEncrypted: encryptedPrivateKey,
          },
        });

        logs.push(`✅ Migrated user: ${user.email} -> ${wallet.address}`);
        successCount++;
      } catch (err: any) {
        logs.push(`❌ Failed to migrate user ${user.email}: ${err.message}`);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: usersWithoutWallet.length,
        success: successCount,
        failed: failCount,
      },
      logs,
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
