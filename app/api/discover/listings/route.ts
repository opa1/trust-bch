import { prisma } from "@/lib/db/prisma";
import { verifyAuth } from "@/lib/auth";
import { generateId } from "@/lib/utils/id";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  priceInBCH: z.number().positive("Price must be greater than 0"),
  deliveryDays: z.number().int().positive("Delivery days must be at least 1"),
});

// GET — fetch current user's listing
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.sellerListing.findUnique({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("[Listings] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 },
    );
  }
}

// POST — create or update listing
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createListingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 },
      );
    }

    const { title, description, category, priceInBCH, deliveryDays } =
      result.data;

    // Upsert — create if not exists, update if exists
    const listing = await prisma.sellerListing.upsert({
      where: { userId: auth.userId },
      update: {
        title,
        description,
        category,
        priceInBCH,
        deliveryDays,
      },
      create: {
        id: generateId(),
        userId: auth.userId,
        title,
        description,
        category,
        priceInBCH,
        deliveryDays,
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("[Listings] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save listing" },
      { status: 500 },
    );
  }
}

// DELETE — remove current user's listing
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.sellerListing.findUnique({
      where: { userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    await prisma.sellerListing.delete({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Listings] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 },
    );
  }
}