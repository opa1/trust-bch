import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getDisputeById } from "@/services/dispute.service";
import { NextRequest } from "next/server";

/**
 * GET /api/dispute/[id]
 * Get dispute details with evidence
 *
 * Authorization: User involved in the escrow (buyer or seller)
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

    const userId = authResult.userId;
    const { id: disputeId } = await params;

    // Get dispute (auth handled by service)
    const dispute = await getDisputeById(disputeId, userId);

    if (!dispute) {
      return errorResponse("Dispute not found", 404, "NOT_FOUND");
    }

    return successResponse({
      dispute: {
        id: dispute.id,
        disputeId: dispute.disputeId,
        escrowId: dispute.escrowId,
        raisedBy: dispute.raisedBy,
        reason: dispute.reason,
        status: dispute.status,
        evidence: (dispute.evidence || []).map((ev) => ({
          id: ev.id,
          type: ev.type,
          content: ev.content,
          uploadedBy: ev.uploadedBy,
          uploadedAt: ev.uploadedAt,
        })),
        resolution: dispute.resolution,
        resolvedBy: dispute.resolvedBy,
        resolvedAt: dispute.resolvedAt,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
