"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { StatusBadge } from "./status-badge";
import { SubmitWorkDialog } from "./submit-work-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EscrowInfoCardProps {
  escrow: any;
  onActionComplete: () => void;
}

export function EscrowInfoCard({
  escrow,
  onActionComplete,
}: EscrowInfoCardProps) {
  const { user } = useAuthStore();
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = React.useState(false);

  const handleOpenDispute = async (reason: string) => {
    try {
      setLoadingAction("dispute");
      await apiClient.createDispute(escrow.escrowId || escrow.id, {
        reason,
      });
      setIsDisputeDialogOpen(false);
      onActionComplete();
    } catch (error) {
      console.error("Failed to open dispute:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(escrow.escrowId);
    toast.success("Escrow ID copied to clipboard");
  };

  const handleAction = async (action: string) => {
    try {
      setLoadingAction(action);
      switch (action) {
        case "cancel":
          await apiClient.cancelEscrow(escrow.escrowId || escrow.id);
          break;
        case "release":
          await apiClient.releaseEscrow(escrow.escrowId || escrow.id);
          break;
        case "refund":
          await apiClient.refundEscrow(escrow.escrowId || escrow.id);
          break;
        case "start_work":
          await apiClient.startEscrowWork(escrow.escrowId || escrow.id);
          break;
        case "dispute":
          await apiClient.createDispute(escrow.escrowId || escrow.id, {
            reason: "Manual dispute via actions",
          });
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
      setConfirmAction(null);
      onActionComplete();
    } catch (error) {
      console.error(`Failed to ${action} escrow:`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSubmitWork = async (description: string) => {
    try {
      setLoadingAction("submit_work");
      await apiClient.submitEscrowWork(
        escrow.escrowId || escrow.id,
        description,
      );
      setShowSubmitDialog(false);
      onActionComplete();
    } catch (error) {
      console.error("Failed to submit work:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const isBuyer = user?.id === escrow.buyerUserId;
  const isSeller = user?.id === escrow.sellerUserId;

  const renderActions = () => {
    const status = escrow.status?.toLowerCase();

    // Common actions (Dispute)
    const renderDisputeButton = () =>
      (isBuyer || isSeller) && (
        <Button
          variant="secondary"
          onClick={() => setIsDisputeDialogOpen(true)}
          disabled={!!loadingAction}
          className="text-destructive hover:bg-destructive/10"
        >
          {loadingAction === "dispute" && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Dispute
        </Button>
      );

    switch (status) {
      case "created":
        return (
          <div className="flex gap-2">
            {isBuyer && (
              <Button
                variant="destructive"
                onClick={() => setConfirmAction("cancel")}
                disabled={!!loadingAction}
              >
                {loadingAction === "cancel" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cancel Escrow
              </Button>
            )}
          </div>
        );
      case "awaiting_funding":
      case "pending":
        return (
          <div className="text-sm text-muted-foreground text-center py-2">
            Waiting for BCH deposit...
          </div>
        );
      case "funded":
        return (
          <div className="flex gap-2 w-full flex-wrap">
            {isSeller && (
              <Button
                onClick={() => handleAction("start_work")}
                disabled={!!loadingAction}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loadingAction === "start_work" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start Work
              </Button>
            )}

            {/* Buyer can still release if they want to bypass flow, or wait */}
            {isBuyer && (
              <Button
                onClick={() => setConfirmAction("release")}
                disabled={!!loadingAction}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loadingAction === "release" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Release Funds
              </Button>
            )}

            {isSeller && (
              <Button
                variant="outline"
                onClick={() => setConfirmAction("refund")}
                disabled={!!loadingAction}
                className="flex-1"
              >
                {loadingAction === "refund" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Refund Buyer
              </Button>
            )}
            {renderDisputeButton()}
          </div>
        );
      case "in_progress":
        return (
          <div className="flex gap-2 w-full flex-wrap">
            {isSeller && (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={!!loadingAction}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loadingAction === "submit_work" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Work
              </Button>
            )}
            {isBuyer && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border rounded-md px-3">
                Seller is working on the task...
              </div>
            )}
            {/* Allow release/refund even in progress */}
            {isBuyer && (
              <Button
                onClick={() => setConfirmAction("release")}
                disabled={!!loadingAction}
                variant="outline"
              >
                Release Funds
              </Button>
            )}
            {renderDisputeButton()}
          </div>
        );
      case "submitted":
        return (
          <div className="flex gap-2 w-full flex-wrap">
            {isBuyer && (
              <Button
                onClick={() => setConfirmAction("release")}
                disabled={!!loadingAction}
                className="flex-1 bg-green-600 hover:bg-green-700 w-full"
              >
                {loadingAction === "release" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve & Release Funds
              </Button>
            )}
            {isSeller && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border rounded-md px-3 bg-muted/50">
                Work Submitted - Waiting for Buyer Approval
              </div>
            )}
            {renderDisputeButton()}
          </div>
        );
      case "verified":
        return (
          <div className="flex flex-col gap-3 w-full">
            {isBuyer && (
              <>
                <div className="w-full text-center text-sm text-amber-700 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                  ⚠️ Once released, funds cannot be recovered
                </div>
                <Button
                  onClick={() => setConfirmAction("release")}
                  disabled={!!loadingAction}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
                >
                  {loadingAction === "release" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  💸 Release Funds to Seller
                </Button>
              </>
            )}
            {isSeller && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border rounded-md px-3 py-3 bg-muted/50">
                Work Approved ✅ — Waiting for Buyer to Release Funds
              </div>
            )}
            {renderDisputeButton()}
          </div>
        );
      case "released":
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full text-center text-sm text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded">
              ✅ Funds successfully released!
            </div>
            {escrow.txHash && (
              <a
                href={`https://blockchair.com/bitcoin-cash/transaction/${escrow.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Transaction on Blockchain
              </a>
            )}
          </div>
        );
      case "disputed":
        return (
          <div className="flex gap-2 w-full flex-wrap">
            <div className="w-full text-center text-sm text-destructive font-medium mb-2 border border-destructive/20 bg-destructive/10 p-2 rounded">
              Dispute Active - You can still resolve this manually if agreed.
            </div>
            {isBuyer && (
              <Button
                onClick={() => setConfirmAction("release")}
                disabled={!!loadingAction}
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                {loadingAction === "release" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Release Funds
              </Button>
            )}
            {isSeller && (
              <Button
                variant="outline"
                onClick={() => setConfirmAction("refund")}
                disabled={!!loadingAction}
                className="flex-1 border-red-200 hover:bg-red-50"
              >
                {loadingAction === "refund" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Refund Buyer
              </Button>
            )}
          </div>
        );
      default:
        return null;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col-reverse sm:flex-row gap-3 items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold break-words">
              {escrow.description}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              ID: {escrow.escrowId}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={handleCopyId}
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only">Copy ID</span>
              </Button>
            </CardDescription>
          </div>
          <StatusBadge status={escrow.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Amount
          </span>
          <span className="text-3xl font-bold text-primary">
            {escrow.amountBCH} BCH
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {escrow.buyerUserId && (
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Buyer
              </span>
              <span className="font-medium truncate">{escrow.buyerUserId}</span>
            </div>
          )}
          {escrow.sellerUserId && (
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Seller
              </span>
              <span className="font-medium truncate">
                {escrow.sellerUserId}
              </span>
            </div>
          )}
        </div>

        {/* Display Submitted Work */}
        {escrow.submissionContent && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Submitted Work
            </h4>
            <div className="bg-background rounded border p-3 text-sm whitespace-pre-wrap font-mono">
              {escrow.submissionContent}
            </div>
            {escrow.submittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted on {new Date(escrow.submittedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Created
            </span>
            <span>{new Date(escrow.createdAt).toLocaleString()}</span>
          </div>
          {escrow.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> Expires
              </span>
              <span>{new Date(escrow.expiresAt).toLocaleString()}</span>
            </div>
          )}
          {escrow.completedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </span>
              <span>{new Date(escrow.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 relative">
        {renderActions()}
      </CardFooter>

      <ConfirmActionDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={dialogContent.title}
        description={dialogContent.description}
        actionLabel={dialogContent.actionLabel}
        variant={dialogContent.variant}
        isLoading={!!loadingAction}
        onConfirm={() => handleAction(confirmAction!)}
      />

      <SubmitWorkDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onSubmit={handleSubmitWork}
        isLoading={loadingAction === "submit_work"}
      />

      <OpenDisputeDialog
        open={isDisputeDialogOpen}
        onOpenChange={setIsDisputeDialogOpen}
        onSubmit={handleOpenDispute}
        isLoading={loadingAction === "dispute"}
      />
    </Card>
  );
}

function OpenDisputeDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Dispute</DialogTitle>
          <DialogDescription>
            Please describe the issue. This will be shared with the other party
            and support.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[100px] mb-4"
            required
            minLength={5}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || reason.length < 5}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Open Dispute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
