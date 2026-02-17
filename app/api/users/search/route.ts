import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/services/auth.service";
import { AppError } from "@/lib/errors/AppError";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await searchUsers(query);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API] User Search Error:", error);
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
