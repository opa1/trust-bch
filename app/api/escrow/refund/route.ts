import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { refundEscrow } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * POST /api/escrow/refund
 * Refund escrow funds to buyer
 * Auth: Required (buyer or seller if expired)
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

    // Refund escrow (authorization and timeout checked in service)
    const escrow = await refundEscrow(escrowId, authResult.userId);

    return successResponse(
      {
        escrow: {
          id: escrow.id,
          escrowId: escrow.escrowId,
          status: escrow.status,
          txHash: escrow.txHash,
          completedAt: escrow.completedAt,
        },
      },
      "Escrow refunded successfully",
    );
  } catch (error) {
    return handleError(error);
  }
}
