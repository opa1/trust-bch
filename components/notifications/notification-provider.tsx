"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export interface Notification {
  id: string;
  type: string;
  message: string;
  resourceId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Sound effect ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio (optional, user needs to interact first usually)
  }, []);

  // Use refs to track state for polling without stale closures
  const notificationsRef = React.useRef<Notification[]>([]);
  const unreadCountRef = React.useRef(0);

  // Update refs when state changes
  useEffect(() => {
    notificationsRef.current = notifications;
    unreadCountRef.current = unreadCount;
  }, [notifications, unreadCount]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiClient.getNotifications();

      // Use refs for comparison to avoid stale closures
      const currentUnreadCount = unreadCountRef.current;
      const currentNotifications = notificationsRef.current;

      // Check for new unread notifications to play sound/toast
      if (data.unreadCount > currentUnreadCount) {
        // New notification arrived!
        const newNotifs = data.notifications.filter(
          (n: Notification) =>
            !n.read && !currentNotifications.find((old) => old.id === n.id),
        );
        if (newNotifs.length > 0) {
          toast.info("New Notification", {
            description: newNotifs[0].message,
          });
          // Play sound if we had one
        }
      }

      // Only update state if changed to avoid re-renders
      if (
        JSON.stringify(data.notifications) !==
        JSON.stringify(currentNotifications)
      ) {
        setNotifications(data.notifications);
      }
      if (data.unreadCount !== currentUnreadCount) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  // Poll every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      // Optimistic updatemarkAsRead
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
