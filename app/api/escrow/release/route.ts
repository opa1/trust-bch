import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { releaseEscrow } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * POST /api/escrow/release
 * Release escrow funds to seller
 * Auth: Required (buyer only)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication via cookie
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Parse request body
    const body = await req.json();
    const { escrowId } = body;

    if (!escrowId) {
      return errorResponse("Escrow ID is required", 400, "VALIDATION_ERROR");
    }

    console.log(
      `[Release API] Buyer ${authResult.userId} releasing escrow ${escrowId}`,
    );

    // Release escrow (authorization checked in service)
    const escrow = await releaseEscrow(escrowId, authResult.userId);

    console.log(`[Release API] ✅ Escrow ${escrowId} released successfully`);

    return successResponse(
      {
        escrow: {
          id: escrow.id,
          escrowId: escrow.escrowId,
          status: escrow.status,
          txHash: escrow.txHash,
          completedAt: escrow.completedAt,
        },
        transactionDetails: {
          txHash: escrow.txHash,
          explorerUrl: escrow.txHash
            ? `https://blockchair.com/bitcoin-cash/transaction/${escrow.txHash}`
            : null,
          amountBCH: escrow.amountBCH,
        },
      },
      "Funds released successfully to seller",
    );
  } catch (error) {
    return handleError(error);
  }
}
