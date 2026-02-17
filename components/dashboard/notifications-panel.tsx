"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { useNotifications } from "@/components/notifications/notification-provider";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel() {
  const { notifications, unreadCount } = useNotifications();

  // Sort by date desc
  const allNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const displayedNotifications = allNotifications.slice(0, 3); // Show latest 3

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Activity
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {displayedNotifications.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}

        {allNotifications.length > 0 && (
          <div className="mt-4 pt-2 border-t flex justify-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all activity
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-4">
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                  <div className="space-y-4">
                    {allNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        full
                      />
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notification,
  full = false,
}: {
  notification: any;
  full?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0 ${
        !notification.read ? "bg-muted/30 -mx-2 px-2 rounded-md" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <p
          className={`text-sm ${
            !notification.read ? "font-semibold" : ""
          } ${full ? "" : "line-clamp-3"}`}
        >
          {notification.message}
        </p>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
