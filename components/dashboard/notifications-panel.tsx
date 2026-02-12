"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function NotificationsPanel() {
  // Mock data for now - ideally this comes from a notifications API
  const notifications = [
    {
      id: 1,
      title: "Welcome to TrustBCH",
      description: "Get started by creating your first escrow transaction.",
      time: "Just now",
    },
    {
      id: 2,
      title: "Security Tip",
      description: "Enable 2FA to secure your account.",
      time: "2h ago",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-muted-foreground">
                {notification.description}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {notification.time}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
