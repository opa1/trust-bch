import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { decryptPrivateKey } from "@/server/blockchain/bch";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/escrow/admin/wallet?id=<escrowId>
 * DEV ONLY — Returns the decrypted private key for an escrow wallet.
 * Use this to import into Electron Cash and sweep funds back.
 * Auth: Required
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return errorResponse("Not available in production", 403, "FORBIDDEN");
  }

  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const escrowId = searchParams.get("id");

    if (!escrowId) {
      return errorResponse("Escrow ID is required", 400, "VALIDATION_ERROR");
    }

    // Find escrow
    let escrow = await prisma.escrow.findUnique({ where: { escrowId } });
    if (!escrow) {
      escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    }

    if (!escrow) {
      return errorResponse("Escrow not found", 404, "NOT_FOUND");
    }

    if (!escrow.privateKeyEncrypted) {
      return errorResponse(
        "No private key stored for this escrow",
        400,
        "VALIDATION_ERROR",
      );
    }

    // Decrypt the private key
    const privateKeyWIF = decryptPrivateKey(escrow.privateKeyEncrypted);

    return successResponse({
      escrowId: escrow.escrowId,
      escrowAddress: escrow.escrowAddress,
      privateKeyWIF,
      instructions: [
        "1. Open Electron Cash",
        "2. Go to Wallet → Private Keys → Import",
        "3. Paste the privateKeyWIF above",
        "4. Send BCH back to your personal address",
      ],
    });
  } catch (error) {
    return handleError(error);
  }
}
