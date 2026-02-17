import { NextRequest, NextResponse } from "next/server";
import { buyerApproveWork } from "@/services/escrow.service";
import { verifyAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const escrowId = params.id;
    const escrow = await buyerApproveWork(escrowId, auth.userId);

    return NextResponse.json({
      success: true,
      escrow,
    });
  } catch (error: any) {
    console.error("[Approve Work] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve work",
        code: error.code,
      },
      { status: error.status || 500 },
    );
  }
}
