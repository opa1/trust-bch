import { NextRequest, NextResponse } from "next/server";
import { getAiVerification } from "@/services/ai-verification.service";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const escrowId = await params.id;

    // Verify user is buyer or seller
    const escrow = await prisma.escrow.findFirst({
      where: {
        OR: [{ escrowId }, { id: escrowId }],
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (
      escrow.buyerUserId !== auth.userId &&
      escrow.sellerUserId !== auth.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const aiVerification = await getAiVerification(escrow.id);

    return NextResponse.json({
      success: true,
      aiVerification,
    });
  } catch (error: any) {
    console.error("[Get AI Verification] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch AI verification",
      },
      { status: 500 },
    );
  }
}
