import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getEscrow } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * GET /api/escrow/[id]
 * Fetch single escrow details
 *
 * Authorization: Buyer or Seller only
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { id: escrowId } = await params;
    const userId = authResult.userId;

    // Get escrow (auth handled by service)
    const escrow = await getEscrow(escrowId, userId);

    if (!escrow) {
      return errorResponse("Escrow not found", 404, "NOT_FOUND");
    }

    return successResponse({
      escrow: {
        id: escrow.id,
        escrowId: escrow.escrowId,
        description: escrow.description,
        amountBCH: escrow.amountBCH,
        escrowAddress: escrow.escrowAddress,
        status: escrow.status,
        buyerUserId: escrow.buyerUserId,
        sellerUserId: escrow.sellerUserId,
        txHash: escrow.txHash,
        fundedAt: escrow.fundedAt,
        completedAt: escrow.completedAt,
        expiresAt: escrow.expiresAt,
        createdAt: escrow.createdAt,
        updatedAt: escrow.updatedAt,
        disputes: escrow.disputes,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
