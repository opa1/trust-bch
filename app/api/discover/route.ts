import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");

    const listings = await prisma.sellerListing.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            successRate: true,
            completedTasks: true,
            disputeRate: true,
            totalEscrows: true,
            trustScore: {
              select: {
                score: true,
                completedCount: true,
                disputedCount: true,
                avgAiConfidence: true,
                lastCalculated: true,
              },
            },
          },
        },
      },
      take: limit,
    });

    // Sort by trust score descending (sellers with no score go to bottom)
    const sorted = listings.sort((a, b) => {
      const scoreA = a.user.trustScore?.score ?? 0;
      const scoreB = b.user.trustScore?.score ?? 0;
      return scoreB - scoreA;
    });

    return NextResponse.json({ listings: sorted });
  } catch (error) {
    console.error("[Discover] Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}
