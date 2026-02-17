"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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

interface AiRecommendationPanelProps {
  escrowId: string;
  isBuyer: boolean;
  aiVerification: AiVerificationData | null;
  onApprove: () => void;
  onRequestRevision: () => void;
}

export function AiRecommendationPanel({
  escrowId,
  isBuyer,
  aiVerification,
  onApprove,
  onRequestRevision,
}: AiRecommendationPanelProps) {
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = React.useState(false);
  const [revisionFeedback, setRevisionFeedback] = React.useState("");
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = React.useState(false);

  if (!aiVerification) {
    return null;
  }

  const { recommendation, reason, confidence, findings } = aiVerification;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await apiClient.approveWork(escrowId);
      onApprove();
    } catch (error) {
      console.error("Failed to approve work:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      toast.error("Please provide feedback for the revision request");
      return;
    }

    try {
      setIsRequestingRevision(true);
      await apiClient.requestRevision(escrowId, revisionFeedback);
      setIsRevisionDialogOpen(false);
      onRequestRevision();
    } catch (error) {
      console.error("Failed to request revision:", error);
    } finally {
      setIsRequestingRevision(false);
    }
  };

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
    <Card className="border-2 border-primary/10 overflow-hidden">
      <div className="bg-muted/30 p-4 border-b flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">AI Verification Analysis</h3>
        <Badge variant="outline" className="ml-auto">
          {Math.round(confidence * 100)}% Confidence
        </Badge>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Recommendation Banner */}
        <div
          className={cn(
            "p-4 rounded-lg border flex items-start gap-3",
            getRecommendationColor(recommendation),
          )}
        >
          <div className="mt-0.5">{getRecommendationIcon(recommendation)}</div>
          <div className="space-y-1">
            <h4 className="font-semibold">
              AI Recommendation: {recommendation.replace("_", " ")}
            </h4>
            <p className="text-sm opacity-90">{reason}</p>
          </div>
        </div>

        {/* Findings Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Positive Signals
            </h4>
            {findings.positiveSignals.length > 0 ? (
              <ul className="text-sm space-y-1 pl-6 list-disc marker:text-green-500/50">
                {findings.positiveSignals.map((signal, i) => (
                  <li key={i}>{signal}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic pl-6">
                None detected
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Concerns & Considerations
            </h4>
            {findings.concernsFound.length > 0 ? (
              <ul className="text-sm space-y-1 pl-6 list-disc marker:text-amber-500/50">
                {findings.concernsFound.map((concern, i) => (
                  <li key={i}>{concern}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic pl-6">
                None detected
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs">
              Link Accessible
            </span>
            <Badge
              variant={findings.linkAccessible ? "secondary" : "destructive"}
            >
              {findings.linkAccessible ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs">
              Content Type
            </span>
            <span className="font-medium capitalize">
              {findings.contentType || "Unknown"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs">
              Completeness
            </span>
            <span className="font-medium capitalize">
              {findings.apparentCompleteness || "Unknown"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs">
              Matches Desc
            </span>
            <Badge
              variant={findings.matchesDescription ? "secondary" : "outline"}
            >
              {findings.matchesDescription ? "Yes" : "No / Unclear"}
            </Badge>
          </div>
        </div>
      </CardContent>

      {isBuyer && (
        <CardFooter className="bg-muted/30 p-4 flex flex-col sm:flex-row gap-3 justify-end items-center border-t">
          <p className="text-xs text-muted-foreground mr-auto hidden sm:block">
            As the buyer, you have the final decision.
          </p>

          <Dialog
            open={isRevisionDialogOpen}
            onOpenChange={setIsRevisionDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Request Revision
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Revision</DialogTitle>
                <DialogDescription>
                  Provide detailed feedback to the seller on what needs to be
                  improved. Use this for minor fixes. For major issues or fraud,
                  consider opening a dispute.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Describe exactly what needs to be fixed..."
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                className="min-h-25"
              />
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsRevisionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestRevision}
                  disabled={isRequestingRevision}
                >
                  {isRequestingRevision ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isApproving ? "Approving..." : "Approve Work"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
