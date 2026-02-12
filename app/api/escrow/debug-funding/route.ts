import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import {
  getAddressBalance,
  getAddressTransactions,
} from "@/server/blockchain/bch";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/escrow/debug-funding?id=<escrowId>
 * Debug endpoint to check what the blockchain API returns for an escrow address
 * Auth: Required
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const escrowId = searchParams.get("id");

    if (!escrowId) {
      return errorResponse("Escrow ID is required", 400, "VALIDATION_ERROR");
    }

    // Find escrow
    let escrow = await prisma.escrow.findUnique({ where: { escrowId } });
    if (!escrow) {
      escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    }

    if (!escrow) {
      return errorResponse("Escrow not found", 404, "NOT_FOUND");
    }

    // Check blockchain (uses multi-provider fallback automatically)
    let balance = null;
    let balanceError = null;
    let transactions = null;
    let txError = null;

    try {
      balance = await getAddressBalance(escrow.escrowAddress);
    } catch (e: any) {
      balanceError = e.message || String(e);
    }

    try {
      transactions = await getAddressTransactions(escrow.escrowAddress);
    } catch (e: any) {
      txError = e.message || String(e);
    }

    return successResponse({
      debug: {
        escrowId: escrow.escrowId,
        escrowAddress: escrow.escrowAddress,
        requiredAmount: escrow.amountBCH,
        currentStatus: escrow.status,
        network: process.env.BCH_NETWORK || "mainnet",
        balance,
        balanceError,
        transactions,
        txError,
        wouldFund: balance ? balance.confirmed >= escrow.amountBCH : false,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
