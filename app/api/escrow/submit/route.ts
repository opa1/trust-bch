import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { submitEscrowWork } from "@/services/escrow.service";
import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const submitWorkSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = submitWorkSchema.parse(body);

    const escrow = await submitEscrowWork(
      validatedData.escrowId,
      auth.userId,
      validatedData.description,
    );

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

    console.error("Submit work error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
