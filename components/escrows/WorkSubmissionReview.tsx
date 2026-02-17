"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Github,
  ImageIcon,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { ApproveWorkModal } from "./modals/ApproveWorkModal";
import { DisputeModal } from "./modals/DisputeModal";
import { RevisionRequestModal } from "./modals/RevisionRequestModal";

interface AiVerificationData {
  recommendation: "APPROVE" | "REJECT" | "NEEDS_REVIEW";
  reason: string;
  confidence: number;
  findings: {
    linkAccessible: boolean;
    contentType: string;
    apparentCompleteness: string;
    matchesDescription: boolean;
    concernsFound: string[];
    positiveSignals: string[];
  };
  verifiedAt: string;
}

interface WorkSubmissionReviewProps {
  escrow: {
    id: string;
    submissionContent?: string;
    buyerUserId: string;
    sellerUserId: string;
    status: string;
  };
  currentUserId?: string;
  aiVerification?: AiVerificationData | null;
  onApprove: () => Promise<void>;
  onRequestRevision: (feedback: string) => Promise<void>;
  onDispute: (reason: string) => Promise<void>;
}

export function WorkSubmissionReview({
  escrow,
  currentUserId,
  aiVerification,
  onApprove,
  onRequestRevision,
  onDispute,
}: WorkSubmissionReviewProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Determine user role
  const isBuyer = currentUserId === escrow.buyerUserId;
  const isSeller = currentUserId === escrow.sellerUserId;

  // Only show actions if buyer and status allows
  const canTakeAction =
    isBuyer && (escrow.status === "SUBMITTED" || escrow.status === "VERIFIED");

  // Extract URLs from submission content
  const extractUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const urls = extractUrls(escrow.submissionContent || "");
  const imageUrls = urls.filter((url) =>
    /\.(jpg|jpeg|png|gif|webp)|cloudinary\.com|imgur\.com/i.test(url),
  );
  const githubUrls = urls.filter((url) => /github\.com/i.test(url));

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "APPROVE":
        return "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "REJECT":
        return "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "APPROVE":
        return <CheckCircle2 className="h-5 w-5" />;
      case "REJECT":
        return <ShieldAlert className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/10 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              📤 Work Submission Review
            </CardTitle>
            {isSeller && <Badge variant="secondary">Read Only View</Badge>}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Submission Content Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Submitted Content
            </h4>
            <div className="bg-muted/30 p-4 rounded-md border text-sm whitespace-pre-wrap font-mono break-all overflow-hidden">
              {escrow.submissionContent || "No content provided."}
            </div>

            {/* Link Previews */}
            {urls.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Attached Evidence:</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-md overflow-hidden border bg-muted group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="object-cover w-full h-full hover:scale-105 transition-transform"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-xs font-medium flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> View Full
                        </span>
                      </a>
                    </div>
                  ))}

                  {githubUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                      <div className="bg-black/5 dark:bg-white/10 p-2 rounded-full">
                        <Github className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          GitHub Repository
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {url}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* AI Analysis Section */}
          {aiVerification ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Analysis
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Confidence:</span>
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        aiVerification.confidence > 0.8
                          ? "bg-green-500"
                          : aiVerification.confidence > 0.5
                            ? "bg-yellow-500"
                            : "bg-red-500",
                      )}
                      style={{
                        width: `${Math.round(aiVerification.confidence * 100)}%`,
                      }}
                    />
                  </div>
                  <span>{Math.round(aiVerification.confidence * 100)}%</span>
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border flex items-start gap-3",
                  getRecommendationColor(aiVerification.recommendation),
                )}
              >
                <div className="mt-0.5">
                  {getRecommendationIcon(aiVerification.recommendation)}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold">
                    Recommendation:{" "}
                    {aiVerification.recommendation.replace("_", " ")}
                  </h4>
                  <p className="text-sm opacity-90">{aiVerification.reason}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Positive Signals
                  </h5>
                  {aiVerification.findings.positiveSignals.length > 0 ? (
                    <ul className="text-sm space-y-1.5 list-disc pl-5 text-muted-foreground">
                      {aiVerification.findings.positiveSignals.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic pl-6">
                      None detected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Concerns
                  </h5>
                  {aiVerification.findings.concernsFound.length > 0 ? (
                    <ul className="text-sm space-y-1.5 list-disc pl-5 text-muted-foreground">
                      {aiVerification.findings.concernsFound.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic pl-6">
                      None detected
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border rounded-lg bg-muted/20 border-dashed">
              <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                AI Analysis is pending or unavailable.
              </p>
            </div>
          )}
        </CardContent>

        {/* Action Buttons for Buyer */}
        {canTakeAction && (
          <CardFooter className="bg-muted/30 p-4 border-t flex flex-col sm:flex-row gap-3 justify-end items-center">
            <Button
              variant="ghost"
              className="w-full sm:w-auto text-muted-foreground hover:text-destructive"
              onClick={() => setIsDisputeOpen(true)}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Dispute Work
            </Button>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setIsRevisionOpen(true)}
              >
                Request Revision
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsApproveOpen(true)}
              >
                Approve Work
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Modals */}
      <ApproveWorkModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={async () => {
          setIsLoading(true);
          await onApprove();
          setIsLoading(false);
          setIsApproveOpen(false);
        }}
        isLoading={isLoading}
        amountBCH={0} // TODO: Pass amount
        sellerName="Seller" // TODO: Pass seller nam
      />

      <RevisionRequestModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        onSubmit={async (feedback: string) => {
          setIsLoading(true);
          await onRequestRevision(feedback);
          setIsLoading(false);
          setIsRevisionOpen(false);
        }}
        isLoading={isLoading}
      />

      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onSubmit={async (reason: string) => {
          setIsLoading(true);
          await onDispute(reason);
          setIsLoading(false);
          setIsDisputeOpen(false);
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
