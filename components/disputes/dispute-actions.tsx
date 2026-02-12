"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DisputeActionsProps {
  escrowId: string;
  disputeId: string;
}

export function DisputeActions({ escrowId, disputeId }: DisputeActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/escrow/${escrowId}`)}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        View Escrow
      </Button>
      {/* Future: Add specific actions like "View Evidence" which might open a modal */}
    </div>
  );
}
