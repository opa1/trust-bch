import { NextResponse, NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { concedeDispute } from "@/services/dispute.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { disputeId } = await params;

    const dispute = await concedeDispute(disputeId, authResult.userId);

    return NextResponse.json({ dispute });
  } catch (error: any) {
    console.error("Error conceding dispute:", error);

    // Check for AppError properties
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    return NextResponse.json(
      {
        error: message,
        code: error.code, // Useful for client to handle specific errors like INSUFFICIENT_FUNDS
        action: error.action,
        metadata: error.metadata,
      },
      { status: statusCode },
    );
  }
}
