"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

interface EscrowActionsProps {
  escrowId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  onActionComplete: () => void;
}

export function EscrowActions({
  escrowId,
  status,
  isBuyer,
  isSeller,
  onActionComplete,
}: EscrowActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    try {
      setIsLoading(true);

      switch (action) {
        case "fund":
          await apiClient.updateEscrow(escrowId, { status: "FUNDED" });
          break;
        case "cancel":
          await apiClient.cancelEscrow(escrowId);
          break;
        case "release":
          await apiClient.releaseEscrow(escrowId);
          break;
        case "refund":
          await apiClient.refundEscrow(escrowId);
          break;
        case "dispute":
          await apiClient.createDispute(escrowId, {
            reason: "Manual dispute via actions",
          });
          break;
        default:
          console.warn("Unknown action:", action);
      }

      setConfirmAction(null);
      onActionComplete();
    } catch (error) {
      console.error(`Failed to ${action} escrow:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (confirmAction) {
      case "release":
        return {
          title: "Release Funds?",
          description:
            "Are you sure you want to release the funds to the seller? This action cannot be undone.",
          actionLabel: "Release Funds",
          variant: "default" as const,
        };
      case "refund":
        return {
          title: "Refund Buyer?",
          description:
            "Are you sure you want to refund the buyer? The funds will be returned to their wallet.",
          actionLabel: "Refund Buyer",
          variant: "default" as const,
        };
      case "cancel":
        return {
          title: "Cancel Escrow?",
          description:
            "Are you sure you want to cancel this escrow? This cannot be undone.",
          actionLabel: "Cancel Escrow",
          variant: "destructive" as const,
        };
      default:
        return {
          title: "Confirm Action",
          description: "Are you sure you want to proceed?",
          actionLabel: "Confirm",
          variant: "default" as const,
        };
    }
  };

  const dialogContent = getDialogContent();
  const normalizedStatus = status.toLowerCase().replace(/_/g, "_");
  const canCancel =
    isBuyer &&
    ["created", "awaiting_funding", "pending"].includes(normalizedStatus);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/escrows/${escrowId}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmAction("cancel")}
                className="text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Escrow
              </DropdownMenuItem>
            </>
          )}

          {["funded", "verified"].includes(status.toLowerCase()) && (
            <>
              <DropdownMenuSeparator />
              {isBuyer && (
                <DropdownMenuItem onClick={() => setConfirmAction("release")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Release Funds
                </DropdownMenuItem>
              )}
              {isSeller && status.toLowerCase() === "funded" && (
                <DropdownMenuItem onClick={() => setConfirmAction("refund")}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refund Buyer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(isBuyer || isSeller) && (
                <DropdownMenuItem
                  onClick={() => handleAction("dispute")}
                  className="text-destructive"
                >
                  <AlertOctagon className="mr-2 h-4 w-4" />
                  Open Dispute
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={dialogContent.title}
        description={dialogContent.description}
        actionLabel={dialogContent.actionLabel}
        variant={dialogContent.variant}
        isLoading={isLoading}
        onConfirm={() => handleAction(confirmAction!)}
      />
    </>
  );
}
