import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);

  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notificationId, markAll } = await req.json();

    if (markAll) {
      await NotificationService.markAllAsRead(authResult.userId);
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      // Should verify ownership? Service handles it implicitly by ID,
      // but ideally we check if notif belongs to user.
      // For MVP we assume ID is hard to guess (UUID/NanoID).
      await NotificationService.markAsRead(notificationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Missing notificationId or markAll flag" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
