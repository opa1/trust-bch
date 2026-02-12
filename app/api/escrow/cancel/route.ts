import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { cancelEscrow } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * POST /api/escrow/cancel
 * Cancel an escrow that hasn't been funded yet (buyer only)
 * Auth: Required (buyer)
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const { escrowId } = body;

    if (!escrowId) {
      return errorResponse("Escrow ID is required", 400, "VALIDATION_ERROR");
    }

    const cancelled = await cancelEscrow(escrowId, authResult.userId!);

    return successResponse({
      message: "Escrow cancelled successfully",
      escrow: cancelled,
    });
  } catch (error) {
    return handleError(error);
  }
}
