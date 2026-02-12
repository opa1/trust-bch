import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import {
  checkEscrowFunding,
  getEscrowWithConfirmations,
} from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * GET /api/escrow/status?id=<escrowId>
 * Get escrow status and check for funding
 * Auth: Required (buyer or seller)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication via cookie
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Get escrow ID from query params
    const { searchParams } = new URL(req.url);
    const escrowId = searchParams.get("id");

    if (!escrowId) {
      return errorResponse("Escrow ID is required", 400, "VALIDATION_ERROR");
    }

    // Check for funding updates (non-blocking - don't fail if blockchain API is down)
    try {
      await checkEscrowFunding(escrowId);
    } catch (fundingError) {
      console.warn(
        "[escrow/status] Funding check failed (blockchain API may be unreachable):",
        fundingError,
      );
    }

    // Get updated escrow with confirmations
    const result = await getEscrowWithConfirmations(
      escrowId,
      authResult.userId,
    );

    if (!result) {
      return errorResponse("Escrow not found", 404, "NOT_FOUND");
    }

    const { escrow, confirmations } = result;

    return successResponse({
      escrow: {
        id: escrow.id,
        escrowId: escrow.escrowId,
        buyerUserId: escrow.buyerUserId,
        sellerUserId: escrow.sellerUserId,
        amountBCH: escrow.amountBCH,
        description: escrow.description,
        escrowAddress: escrow.escrowAddress,
        status: escrow.status,
        txHash: escrow.txHash,
        confirmations,
        expiresAt: escrow.expiresAt,
        fundedAt: escrow.fundedAt,
        completedAt: escrow.completedAt,
        createdAt: escrow.createdAt,
        updatedAt: escrow.updatedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
