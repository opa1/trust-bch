import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
  validationErrorResponse,
} from "@/lib/utils/responses";
import { buyerOpenDispute } from "@/services/escrow.service";
import { NextRequest } from "next/server";
import { z } from "zod";

const disputeSchema = z.object({
  reason: z.string().min(50, "Dispute reason must be at least 50 characters"),
});

/**
 * POST /api/escrow/[id]/dispute
 * Open a dispute for an escrow
 *
 * Authorization: Buyer only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { id: escrowId } = await params;
    const body = await req.json();

    // Validate request body
    const validation = disputeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { reason } = validation.data;

    // Check if user is the buyer (handled in service but good to check access early if needed)
    // Here we let the service handle logic to keep API layer thin.

    const disputedEscrow = await buyerOpenDispute(
      escrowId,
      auth.userId,
      reason,
    );

    return successResponse({
      escrow: disputedEscrow,
      message: "Dispute opened successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
