"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Pencil } from "lucide-react";

interface SellerCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    priceInBCH: number;
    deliveryDays: number;
    user: {
      id: string;
      email: string;
      fullName: string;
      successRate: number;
      completedTasks: number;
      totalEscrows: number;
      trustScore?: {
        score: number;
        completedCount: number;
        disputedCount: number;
        avgAiConfidence: number;
      } | null;
    };
  };
}

function TrustBadge({ score }: { score: number }) {
  if (score >= 75)
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        ⚡ High Trust
      </Badge>
    );
  if (score >= 40)
    return (
      <Badge className="bg-accent text-accent-foreground border-border">
        ✓ Trusted
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border-border">
      New Seller
    </Badge>
  );
}

export function SellerCard({ listing }: SellerCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const score = listing.user.trustScore?.score ?? 0;
  const completedCount = listing.user.trustScore?.completedCount ?? 0;
  const avgAiConfidence = listing.user.trustScore?.avgAiConfidence ?? 0;

  const isOwner = user?.id === listing.user.id;

  return (
    <Card className="group hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {listing.user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm leading-tight">
                {listing.user.fullName}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {listing.category}
              </p>
            </div>
          </div>
          <TrustBadge score={score} />
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-foreground mb-1 leading-snug">
          {listing.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
          {listing.description}
        </p>

        {/* Trust Score Bar */}
        {(score > 0 || listing.user.completedTasks > 0) && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">Trust Score</span>
              <span className="text-xs font-semibold text-primary">
                {score.toFixed(0)}/100
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-foreground font-semibold text-sm">
              {listing.user.completedTasks}
            </p>
            <p className="text-muted-foreground text-xs">Done</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-foreground font-semibold text-sm">
              {listing.user.successRate.toFixed(0)}%
            </p>
            <p className="text-muted-foreground text-xs">Success</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-foreground font-semibold text-sm">
              {(avgAiConfidence * 100).toFixed(0)}%
            </p>
            <p className="text-muted-foreground text-xs">AI Score</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-bold">
              {listing.priceInBCH} BCH
            </p>
            <p className="text-muted-foreground text-xs">
              {listing.deliveryDays}d delivery
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => router.push("/discover/listing/edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams({
                    sellerEmail: listing.user.email,
                    sellerName: listing.user.fullName,
                    amount: String(listing.priceInBCH),
                    description: listing.title,
                  });
                  router.push(`/escrows/create?${params.toString()}`);
                }}
              >
                Start Escrow
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
