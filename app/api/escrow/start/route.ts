import { verifyAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors/AppError";
import { startEscrowWorkSchema } from "@/lib/validations/escrow";
import { startEscrowWork } from "@/services/escrow.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = startEscrowWorkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 },
      );
    }

    const { escrowId } = result.data;

    const escrow = await startEscrowWork(escrowId, auth.userId);

    return NextResponse.json({ escrow });
  } catch (error) {
    // ZodError handling removed as we use safeParse

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Start work error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
