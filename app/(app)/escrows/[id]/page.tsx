"use client";

import { ActionLogs } from "@/components/escrows/action-logs";
import { DisputePanel } from "@/components/escrows/dispute-panel";
import { EscrowInfoCard } from "@/components/escrows/escrow-info-card";
import { FundingPanel } from "@/components/escrows/funding-panel";
import { FundingStatus } from "@/components/escrows/funding-status";
import { StatusBanner } from "@/components/escrows/StatusBanner";
import { WorkSubmissionReview } from "@/components/escrows/WorkSubmissionReview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export default function EscrowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const user = useAuthStore((s) => s.user);
  const [escrow, setEscrow] = React.useState<any>(null);
  const [aiVerification, setAiVerification] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAiVerification = React.useCallback(async (escrowId: string) => {
    try {
      const response = await apiClient.getAiVerification(escrowId);
      if (response && response.success) {
        setAiVerification(response.aiVerification);
      }
    } catch (err) {
      console.error("Failed to load AI verification:", err);
      // Suppress error as AI verification might not exist yet
    }
  }, []);

  const loadEscrow = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getEscrow(id);
      // Handle response structure: { success: true, data: { escrow: ... } }
      const loadedEscrow = data.data?.escrow || data.escrow || data;
      setEscrow(loadedEscrow);

      // Load AI verification if loadedEscrow exists
      if (loadedEscrow && (loadedEscrow.escrowId || loadedEscrow.id)) {
        loadAiVerification(loadedEscrow.escrowId || loadedEscrow.id); // Try with escrowId first as usually used in API, but endpoint might expect ID or EscrowID. My API handles both.
      }
    } catch (err) {
      console.error("Failed to load escrow:", err);
      setError("Failed to load escrow details.");
      toast.error("Could not fetch escrow information");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadEscrow();

    // Persist user balance on page load (background fetch)
    if (user?.walletAddress) {
      apiClient.getWalletBalance().catch((err) => {
        console.error("Background balance update failed:", err);
      });
    }
  }, [loadEscrow, user?.walletAddress]);

  // Callback when FundingStatus detects a status change
  const handleStatusChange = React.useCallback(
    (newStatus: string) => {
      toast.success("Escrow funded!", {
        description: "Your BCH deposit has been confirmed.",
      });
      // Reload escrow to get the latest data
      loadEscrow();
    },
    [loadEscrow],
  );

  const isBuyer = user?.id === escrow?.buyerUserId;
  const canCancel =
    isBuyer &&
    ["awaiting_funding", "created", "pending"].includes(
      escrow?.status?.toLowerCase() || "",
    );

  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleCancel = async () => {
    if (!escrow) return;
    try {
      setIsCancelling(true);
      await apiClient.cancelEscrow(escrow.escrowId || escrow.id);
      toast.success("Escrow cancelled");
      loadEscrow();
    } catch (err) {
      console.error("Failed to cancel escrow:", err);
      toast.error("Failed to cancel escrow");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!escrow) return;
      await apiClient.approveWork(escrow.escrowId || escrow.id);
      toast.success(
        "Work approved! Funds will be released pending confirmation.",
      );
      loadEscrow();
      // Refresh AI verification too if needed, though status change is main thing
    } catch (error: any) {
      console.error("Failed to approve work:", error);
      toast.error(error.message || "Failed to approve work");
    }
  };

  const handleRequestRevision = async (feedback: string) => {
    try {
      if (!escrow) return;
      await apiClient.requestRevision(escrow.escrowId || escrow.id, feedback);
      toast.success("Revision requested. Seller has been notified.");
      loadEscrow();
    } catch (error: any) {
      console.error("Failed to request revision:", error);
      toast.error(error.message || "Failed to request revision");
    }
  };

  const handleDispute = async (reason: string) => {
    try {
      if (!escrow) return;
      await apiClient.disputeEscrow(escrow.escrowId || escrow.id, reason);
      toast.success("Dispute opened. Admin will review shortly.");
      loadEscrow();
    } catch (error: any) {
      console.error("Failed to open dispute:", error);
      toast.error(error.message || "Failed to open dispute");
    }
  };

  const showReviewComponent =
    escrow &&
    (escrow.status === "SUBMITTED" ||
      escrow.status === "VERIFIED" ||
      escrow.status === "RELEASED") &&
    escrow.submissionContent;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">
          {error || "Escrow not found"}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const normalizedStatus = escrow.status?.toLowerCase() || "";
  const showDepositUI =
    normalizedStatus === "awaiting_funding" ||
    normalizedStatus === "created" ||
    normalizedStatus === "pending";

  // Show status monitor if waiting for funding OR if funding is in progress
  const showStatusMonitor =
    showDepositUI || normalizedStatus === "funding_in_progress";

  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-2xl font-bold tracking-tight">Escrow Details</h1>
        </div>

        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full sm:w-auto h-11"
                variant="destructive"
                size="sm"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel Escrow
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this escrow?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The escrow will be permanently
                  cancelled and any pending deposit window will close.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Escrow</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Cancel Escrow
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Main Info Column */}
        <div className="md:col-span-3 space-y-6 min-w-0">
          {/* Status Banner */}
          {escrow && (
            <StatusBanner
              status={escrow.status}
              isBuyer={isBuyer}
              isSeller={user?.id === escrow.sellerUserId}
              txHash={escrow.txHash}
            />
          )}

          <EscrowInfoCard escrow={escrow} onActionComplete={loadEscrow} />

          {/* Work Submission Review */}
          {showReviewComponent && (
            <WorkSubmissionReview
              escrow={escrow}
              currentUserId={user?.id}
              aiVerification={aiVerification}
              onApprove={handleApprove}
              onRequestRevision={handleRequestRevision}
              onDispute={handleDispute}
            />
          )}

          {/* Funding Panel for Buyer - ONLY when waiting for funding */}
          {showDepositUI && user?.id === escrow.buyerUserId && (
            <FundingPanel
              escrow={escrow}
              user={user}
              onFunded={() => {
                toast.success("Escrow funded successfully");
                loadEscrow();
              }}
            />
          )}

          {/* Status Monitor for tracking blockchain progress */}
          {showStatusMonitor && (
            <FundingStatus
              escrowId={escrow.escrowId || escrow.id}
              currentStatus={escrow.status}
              onStatusChange={handleStatusChange}
            />
          )}

          <DisputePanel escrow={escrow} />
        </div>

        {/* Sidebar Column */}
        <div className="md:col-span-2 space-y-6 min-w-0">
          {/* Removed direct DepositCard from sidebar as it is now in FundingPanel */}

          <ActionLogs logs={escrow.logs || []} />
        </div>
      </div>
    </div>
  );
}
