"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import { EscrowInfoCard } from "@/components/escrows/escrow-info-card";
import { DepositCard } from "@/components/escrows/deposit-card";
import { FundingStatus } from "@/components/escrows/funding-status";
import { ActionLogs } from "@/components/escrows/action-logs";
import { DisputePanel } from "@/components/escrows/dispute-panel";
import { toast } from "sonner";

export default function EscrowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const user = useAuthStore((s) => s.user);
  const [escrow, setEscrow] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadEscrow = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getEscrow(id);
      // Handle response structure: { success: true, data: { escrow: ... } }
      setEscrow(data.data?.escrow || data.escrow || data);
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
  }, [loadEscrow]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Escrow Details</h1>
        </div>
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isCancelling}>
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <EscrowInfoCard escrow={escrow} onActionComplete={loadEscrow} />

          {/* Funding status monitor */}
          {showDepositUI && (
            <FundingStatus
              escrowId={escrow.escrowId || escrow.id}
              currentStatus={escrow.status}
              onStatusChange={handleStatusChange}
            />
          )}

          <DisputePanel escrow={escrow} />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Deposit card with QR code — only visible to buyer */}
          {user?.id === escrow.buyerUserId && (
            <DepositCard
              escrowAddress={escrow.escrowAddress}
              amountBCH={escrow.amountBCH}
              expiresAt={escrow.expiresAt}
              status={escrow.status}
            />
          )}

          <ActionLogs logs={escrow.logs || []} />
        </div>
      </div>
    </div>
  );
}
