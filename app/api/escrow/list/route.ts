import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getUserEscrows } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * GET /api/escrow/list
 * List all escrows for the authenticated user
 *
 * Query params:
 * - status: Filter by escrow status (optional)
 * - role: Filter by role - "buyer" | "seller" | "all" (default: "all")
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
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const roleFilter = searchParams.get("role") || "all";

    // Get user's escrows
    const escrows = await getUserEscrows(
      userId,
      roleFilter as any,
      statusFilter,
    );

    return successResponse({
      escrows: escrows.map((escrow) => ({
        id: escrow.id,
        escrowId: escrow.escrowId,
        description: escrow.description,
        amountBCH: escrow.amountBCH,
        status: escrow.status,
        role: escrow.buyerUserId === userId ? "buyer" : "seller",
        fundedAt: escrow.fundedAt,
        completedAt: escrow.completedAt,
        expiresAt: escrow.expiresAt,
        createdAt: escrow.createdAt,
      })),
      total: escrows.length,
    });
  } catch (error) {
    console.error("[API] /api/escrow/list error:", error);
    return handleError(error);
  }
}
