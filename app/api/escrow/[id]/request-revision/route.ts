import { NextRequest, NextResponse } from "next/server";
import { buyerRequestRevision } from "@/services/escrow.service";
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

    const body = await req.json();
    const { feedback } = body;

    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 },
      );
    }

    const escrowId = params.id;
    const escrow = await buyerRequestRevision(escrowId, auth.userId, feedback);

    return NextResponse.json({
      success: true,
      escrow,
    });
  } catch (error: any) {
    console.error("[Request Revision] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to request revision",
        code: error.code,
      },
      { status: error.status || 500 },
    );
  }
}
