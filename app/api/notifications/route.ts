import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { errorResponse, handleError } from "@/lib/utils/responses";
import { NotificationService } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const notifications = await NotificationService.getNotifications(
      authResult.userId,
    );
    const unreadCount = await NotificationService.getUnreadCount(
      authResult.userId,
    );

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleError(error);
  }
}
