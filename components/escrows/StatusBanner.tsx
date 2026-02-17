"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface StatusBannerProps {
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  txHash?: string | null;
  onScrollToReview?: () => void;
}

export function StatusBanner({
  status,
  isBuyer,
  isSeller,
  txHash,
  onScrollToReview,
}: StatusBannerProps) {
  if (status === "SUBMITTED") {
    if (isBuyer) {
      return (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-500 font-semibold">
            Work Submitted - Your Review Required
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400 mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <p>
              The seller has submitted their work. Please review it carefully
              and take action.
            </p>
            {onScrollToReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToReview}
                className="bg-white/50 hover:bg-white/80 border-yellow-300 text-yellow-800"
              >
                Review Submission
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    if (isSeller) {
      return (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-500 font-semibold">
            Work Submitted - Awaiting Buyer Review
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Your work has been submitted and is being reviewed by the buyer. You
            will be notified of their decision.
          </AlertDescription>
        </Alert>
      );
    }
  }

  if (status === "VERIFIED") {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
        <AlertTitle className="text-green-800 dark:text-green-500 font-semibold">
          Work Approved!
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          {isBuyer
            ? "You approved this work. Click 'Release Funds' below to send BCH to the seller."
            : "The buyer approved your work. Waiting for the buyer to release funds to your wallet."}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "RELEASED") {
    return (
      <Alert className="mb-6 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
        <AlertTitle className="text-emerald-800 dark:text-emerald-500 font-semibold">
          ✅ Funds Released Successfully!
        </AlertTitle>
        <AlertDescription className="text-emerald-700 dark:text-emerald-400">
          <p className="mb-2">
            {isBuyer
              ? "You released the funds to the seller. The transaction is on the blockchain."
              : "The buyer has released funds to your wallet. They should appear shortly."}
          </p>
          {txHash && (
            <a
              href={`https://blockchair.com/bitcoin-cash/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 underline hover:opacity-80 font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              View Transaction on Blockchain
            </a>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "DISPUTED") {
    return (
      <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-500" />
        <AlertTitle className="text-red-800 dark:text-red-500 font-semibold">
          Escrow Disputed
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400">
          This escrow is currently under dispute. An admin will review the case
          and resolve it.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "IN_PROGRESS") {
    if (isSeller) {
      return null;
    }
  }

  return null;
}
