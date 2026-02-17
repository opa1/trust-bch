import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";
import { generateId } from "@/lib/utils/id";

export const NotificationService = {
  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50 to prevent performance issues
    });
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    resourceId?: string,
  ) {
    return prisma.notification.create({
      data: {
        id: generateId(),
        userId,
        type,
        message,
        resourceId,
        read: false,
      },
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },
};
