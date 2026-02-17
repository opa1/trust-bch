"use client";

import { CheckCircle2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ApproveWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  amountBCH: number;
  sellerName: string;
}

export function ApproveWorkModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  amountBCH,
  sellerName,
}: ApproveWorkModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            Approve Work & Release Funds?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to approve this work? This action cannot be
              undone.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm border">
              <p className="font-semibold">Consequences:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>
                  The escrow status will change to <strong>VERIFIED</strong>.
                </li>
                <li>
                  Funds will be marked for release to{" "}
                  <strong>{sellerName || "the seller"}</strong>.
                </li>
                <li>The transaction will be completed.</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Processing..." : "Yes, Approve Work"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
