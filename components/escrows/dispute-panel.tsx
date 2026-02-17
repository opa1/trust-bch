"use client";

import { AlertOctagon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DisputeChat } from "@/components/disputes/dispute-chat";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiClient } from "@/lib/api-client";

interface DisputePanelProps {
  escrow: any;
}

export function DisputePanel({ escrow }: DisputePanelProps) {
  const { user } = useAuthStore();

  const activeDispute = escrow.disputes?.find(
    (d: any) => d.status === "OPEN" || d.status === "UNDER_REVIEW",
  );

  if (!activeDispute && escrow.status.toLowerCase() !== "disputed") {
    return null;
  }

  return (
    <Card
      id="dispute-chat"
      className="border-destructive/50 bg-destructive/5 mt-6"
    >
      <CardHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertOctagon className="h-5 w-5" />
          <CardTitle>Dispute Center</CardTitle>
        </div>
        <CardDescription>
          This transaction is disputed. Please provide evidence below or issue a
          resolution if agreed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-3 md:p-6">
        {activeDispute ? (
          <DisputeChat
            disputeId={activeDispute.id || activeDispute.disputeId}
            initialEvidence={activeDispute.evidence || []}
            currentUserId={user?.id || ""}
          />
        ) : (
          <div className="text-center text-muted-foreground p-4">
            Loading dispute details or no active dispute found...
          </div>
        )}

        {/* Concede Button (Buyer Only) */}
        {activeDispute && user && escrow.buyerUserId === user.id && (
          <div className="border-t border-destructive/20 pt-4 flex justify-end">
            <ConcedeButton
              disputeId={activeDispute.id || activeDispute.disputeId}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConcedeButton({ disputeId }: { disputeId: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleConcede = async () => {
    setLoading(true);
    try {
      await apiClient.concedeDispute(disputeId);

      // Toast is handled in apiClient now, but we can keep additional logic here if needed or let apiClient handle it.
      // ApiClient toast says "Dispute conceded successfully"

      router.refresh();
      setShowConfirm(false);
    } catch (error: any) {
      // Error toast handled by apiClient mostly, but we can leave this catch block
      // since apiClient throws.
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Concede Debate & Release Funds
      </Button>

      <ConfirmActionDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Concede Dispute?"
        description="Are you sure you want to concede? This will resolve the dispute in favor of the seller and RELEASE funds immediately. This action cannot be undone."
        actionLabel="Yes, Release Funds"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConcede}
        isLoading={loading}
      />
    </>
  );
}
