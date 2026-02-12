"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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

interface SubmitWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (description: string) => Promise<void>;
  isLoading: boolean;
}

export function SubmitWorkDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: SubmitWorkDialogProps) {
  const [description, setDescription] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(description);
    setDescription(""); // Reset after success (parent handles closing)
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Submit Work</DialogTitle>
          <DialogDescription>
            Provide details of your completed work, such as a link to the
            repository, design files, or a deployment URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="work-description">Submission Details</Label>
            <Textarea
              id="work-description"
              placeholder="e.g. Here is the link to the PR: https://github.com/..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-25"
              required
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !description.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Work
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
