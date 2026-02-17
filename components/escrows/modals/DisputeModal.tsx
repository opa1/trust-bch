"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function DisputeModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim().length < 50) return;
    onSubmit(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Open Dispute
          </DialogTitle>
          <DialogDescription>
            Escalate this escrow to admin review. This action cannot be undone
            easily.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-destructive/10 p-4 rounded-md text-sm border border-destructive/20 text-destructive">
            <h4 className="font-semibold mb-1">Warning: Escalation</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                An impartial admin will review evidence and make a final
                decision.
              </li>
              <li>Funds will be locked until resolution.</li>
              <li>A dispute fee may be deducted from the final amount.</li>
              <li>
                This negatively impacts your trust score if found frivolous.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Dispute</Label>
            <Textarea
              id="reason"
              placeholder="Explain in detail why you are disputing this work. Include facts, not emotions."
              className="min-h-[150px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.trim().length}/50 characters minimum
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || reason.trim().length < 50}
            variant="destructive"
          >
            {isLoading ? "Opening Dispute..." : "Open Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
