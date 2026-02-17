import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getUserById } from "@/services/auth.service";
import { getAddressBalance } from "@/server/blockchain/bch";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const user = await getUserById(authResult.userId);

    if (!user || !user.walletAddress) {
      return errorResponse("Wallet not found", 404, "WALLET_NOT_FOUND");
    }

    const balanceData = await getAddressBalance(user.walletAddress);

    // Persist balance to user profile
    try {
      if (typeof balanceData.confirmed === "number") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            cachedBalance: balanceData.confirmed,
            lastBalanceUpdate: new Date(),
          },
        });
      } else {
        console.warn("Balance confirmed is not a number:", balanceData);
      }
    } catch (dbError) {
      console.error("Failed to update user balance in DB:", dbError);
      // Do not fail the request if persistence fails
    }

    return successResponse({
      address: user.walletAddress,
      balance: balanceData.balance,
      confirmed: balanceData.confirmed,
      unconfirmed: balanceData.unconfirmed,
    });
  } catch (error) {
    console.error("Wallet balance API error:", error);
    return handleError(error);
  }
}
