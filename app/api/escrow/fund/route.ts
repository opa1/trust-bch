import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fundEscrowFromWallet } from "@/services/escrow.service";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/utils/responses";
import { verifyAuth } from "@/lib/auth";

// Schema for request body
const fundEscrowSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validation = fundEscrowSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid request data",
        400,
        "VALIDATION_ERROR",
        validation.error.issues,
      );
    }

    const { escrowId } = validation.data;

    const escrow = await fundEscrowFromWallet(escrowId, authResult.userId);

    return successResponse(
      {
        escrow,
      },
      "Escrow funded successfully",
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
