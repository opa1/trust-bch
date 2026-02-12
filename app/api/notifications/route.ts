import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);

  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await NotificationService.getNotifications(
      authResult.userId,
    );
    const unreadCount = await NotificationService.getUnreadCount(
      authResult.userId,
    );

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
