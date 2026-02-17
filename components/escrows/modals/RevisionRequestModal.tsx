"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

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

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  isLoading: boolean;
}

export function RevisionRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: RevisionRequestModalProps) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (feedback.trim().length < 20) return;
    onSubmit(feedback);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Request Revision
          </DialogTitle>
          <DialogDescription>
            Ask the seller to make changes. The escrow status will revert to "In
            Progress".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback for Seller</Label>
            <Textarea
              id="feedback"
              placeholder="Describe exactly what needs to be fixed or improved..."
              className="min-h-[120px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedback.trim().length}/20 characters minimum
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-sm border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> The seller will be notified immediately. Be
            specific to avoid delays.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || feedback.trim().length < 20}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? "Sending..." : "Request Revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
