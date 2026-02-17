import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { createEscrowSchema } from "@/lib/validations/escrow";
import { getUserById } from "@/services/auth.service";
import { createEscrow } from "@/services/escrow.service";
import { NextRequest } from "next/server";

/**
 * POST /api/escrow/create
 * Create a new escrow transaction
 * Auth: Required (buyer)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication via cookie
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Verify user exists
    const user = await getUserById(authResult.userId);
    if (!user) {
      return errorResponse("User not found", 404, "NOT_FOUND");
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createEscrowSchema.parse(body);

    // Create escrow (buyer is the authenticated user)
    const result = await createEscrow(
      user.email, // buyer email
      validatedData.sellerEmail, // seller email (Standardized)
      validatedData.amountBCH,
      validatedData.description,
      validatedData.expiryHours,
    );

    return successResponse(result, "Escrow created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
