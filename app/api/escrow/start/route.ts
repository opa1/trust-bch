import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { startEscrowWork } from "@/services/escrow.service";
import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const startWorkSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = startWorkSchema.parse(body);

    const escrow = await startEscrowWork(validatedData.escrowId, auth.userId);

    return NextResponse.json({ escrow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

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
