import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { submitEscrowWork } from "@/services/escrow.service";
import { submitEscrowWorkSchema } from "@/lib/validations/escrow";
import { AppError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = submitEscrowWorkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 },
      );
    }

    const { escrowId, description } = result.data;

    const escrow = await submitEscrowWork(escrowId, auth.userId, description);

    return NextResponse.json({ escrow });
  } catch (error) {
    // ZodError handling removed as we use safeParse

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Submit work error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
