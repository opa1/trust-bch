import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getUserDisputes } from "@/services/dispute.service";
import { NextRequest } from "next/server";

/**
 * GET /api/disputes
 * List all disputes for the authenticated user
 *
 * Authorization: Authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const userId = authResult.userId;

    // Get user's disputes
    const disputes = await getUserDisputes(userId);

    return successResponse({
      disputes,
      total: disputes.length,
    });
  } catch (error) {
    console.error("[API] /api/disputes error:", error);
    return handleError(error);
  }
}
