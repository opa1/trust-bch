import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { openDispute } from "@/services/dispute.service";
import { NextRequest } from "next/server";

/**
 * POST /api/dispute/open
 * Open a new dispute for an escrow
 *
 * Body:
 * - escrowId: string (required)
 * - reason: string (required, 20-1000 characters)
 *
 * Authorization: Buyer or Seller of the escrow
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const userId = authResult.userId;
    const body = await req.json();
    const { escrowId, reason } = body;

    // Validation
    if (!escrowId || !reason) {
      return errorResponse(
        "escrowId and reason are required",
        400,
        "VALIDATION_ERROR",
      );
    }

    if (
      typeof reason !== "string" ||
      reason.length < 5 ||
      reason.length > 1000
    ) {
      return errorResponse(
        "Reason must be between 20 and 1000 characters",
        400,
        "VALIDATION_ERROR",
      );
    }

    // Open dispute
    const dispute = await openDispute(escrowId, userId, reason);

    return successResponse({
      dispute: {
        id: dispute.id,
        disputeId: dispute.disputeId,
        escrowId: dispute.escrowId,
        raisedBy: dispute.raisedBy,
        reason: dispute.reason,
        status: dispute.status,
        createdAt: dispute.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
