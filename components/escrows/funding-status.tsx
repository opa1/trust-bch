"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface FundingStatusProps {
  escrowId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function FundingStatus({
  escrowId,
  currentStatus,
  onStatusChange,
}: FundingStatusProps) {
  const [polling, setPolling] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const normalizedStatus = currentStatus?.toLowerCase() || "";
  const shouldPoll =
    normalizedStatus === "awaiting_funding" ||
    normalizedStatus === "created" ||
    normalizedStatus === "pending" ||
    normalizedStatus === "funding_in_progress";

  const isConfirming = normalizedStatus === "funding_in_progress";

  const checkFunding = React.useCallback(async () => {
    try {
      setPolling(true);
      const response = await apiClient.getEscrowStatus(escrowId);
      const escrow = response.data?.escrow || response.escrow || response;
      setLastChecked(new Date());

      if (escrow?.status) {
        const newStatus = escrow.status.toLowerCase();
        if (
          newStatus !== "awaiting_funding" &&
          newStatus !== "created" &&
          newStatus !== "pending" &&
          newStatus !== "funding_in_progress"
        ) {
          onStatusChange(escrow.status);
        }
      }
    } catch (error) {
      console.error("[FundingStatus] Poll error:", error);
    } finally {
      setPolling(false);
    }
  }, [escrowId, onStatusChange]);

  // Start/stop polling based on status
  React.useEffect(() => {
    if (!shouldPoll) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkFunding();

    // Set up polling
    intervalRef.current = setInterval(checkFunding, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldPoll, checkFunding]);

  if (!shouldPoll) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="relative flex items-center justify-center">
        {polling || isConfirming ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        ) : (
          <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isConfirming
            ? "Transaction broadcasted. Confirming..."
            : "Waiting for deposit..."}
        </p>
        <p className="text-xs text-muted-foreground">
          {isConfirming
            ? "Waiting for blockchain confirmation. This typically takes a few minutes."
            : polling
              ? "Checking blockchain..."
              : lastChecked
                ? `Last checked ${lastChecked.toLocaleTimeString()}`
                : "Monitoring for incoming transactions"}
        </p>
      </div>
    </div>
  );
}
