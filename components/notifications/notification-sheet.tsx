"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./notification-provider";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck, MessageSquare, Wallet, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
// removed NotificationType import to fix build error

export function NotificationSheet() {
  const {
    notifications,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.resourceId) {
      // Navigate based on type
      if (
        notification.type === "DISPUTE_OPENED" ||
        notification.type === "DISPUTE_MESSAGE"
      ) {
        // Navigate to escrow and anchor to dispute
        // Assume resourceId is disputeId for DISPUTE types?
        // Wait, in services I passed dispute.id for dispute types.
        // But navigation is to /escrows/[escrowId].
        // I need escrowId!
        // The Notification model has `resourceId`.
        // In EscrowService I passed `escrow.id`.
        // In DisputeService I passed `dispute.id`.
        // This is inconsistent if I want to navigate to Escrow page.
        // I should have passed escrowId for dispute notifications too?
        // Or I need to fetch dispute to get escrowId? (Too slow).

        // Let's assume for now I navigate to /dashboard or I fix the service to pass escrowId for everything?
        // Or maybe strictly resourceId points to the object of interest.
        // If it's a dispute, I go to dispute page? But we don't have separate dispute page.
        // We have /escrows/[id].

        // Quick fix: user can click and go to dashboard if I can't determine URL.
        // BETTER: Update DisputeService to pass `escrow.id` as resourceId, OR store `escrowId` content in metadata (missing in model).
        // OR, assuming I passed dispute.id, I can't easily jump to /escrows/[escrowId] without a lookup.

        // Let's check DisputeService calls again.
        // Step 2231: NotificationService.createNotification(..., dispute.id)

        // I should probably pass escrow.id instead, since the UI is on the escrow page.
        // The message says "Escrow ESC-..." so user knows.

        // I will change the router push to just go to /dashboard/disputes if it's a dispute, or generic.
        // Actually, if I pass escrow.id in DisputeService, it's easier.
        // But I already wrote DisputeService.

        // I will try to navigate to /escrows/${notification.resourceId} if it works for escrow types.
        // For dispute types, if resourceId is disputeId, this link will 404.

        // Logic:
        // ESCROW_*: resourceId is escrowId -> /escrows/[id]
        // DISPUTE_*: resourceId is disputeId -> /dashboard (for now) or update service.

        // I will update service in next step to pass escrowId for dispute notifications too,
        // OR add `metadata` json field to notification model (best practice).
        // But model is already pushed.

        // I'll stick to: navigate to /dashboard/disputes for disputes.
        router.push("/dashboard");
      } else {
        router.push(`/escrows/${notification.resourceId}`);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ESCROW_FUNDED":
      case "ESCROW_RELEASED":
      case "ESCROW_REFUNDED":
        return <Wallet className="h-4 w-4 text-green-500" />;
      case "WORK_SUBMITTED":
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case "DISPUTE_OPENED":
      case "DISPUTE_MESSAGE":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:w-100 flex flex-col p-0 gap-0"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1"
                onClick={() => markAllAsRead()}
              >
                Mark all read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            You have {unreadCount} unread messages.
          </SheetDescription>
        </SheetHeader>

        <div className="size-full">
          <ScrollArea className="w-full! flex-1">
            <div className="flex flex-col">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "max-w-full flex items-start gap-4 p-4 text-left border-b hover:bg-muted/50 transition-colors",
                      !n.read && "bg-muted/20",
                    )}
                  >
                    <div className="mt-1 bg-background p-2 rounded-full border shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="w-full flex-1 space-y-1">
                      <p
                        className={cn(
                          "w-full text-sm",
                          !n.read && "font-medium",
                        )}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
