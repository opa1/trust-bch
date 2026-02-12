import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, ShieldCheck } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  email: string;
  reputation: number;
  completedEscrows: number;
  isVerified?: boolean;
}

interface AgentCardProps {
  agent: Agent;
  variant?: "default" | "compact";
}

export function AgentCard({ agent, variant = "default" }: AgentCardProps) {
  const isCompact = variant === "compact";

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${isCompact ? "border-none p-0 shadow-none hover:shadow-none" : ""}`}
    >
      <CardHeader
        className={`${isCompact ? "p-0 pb-2" : "p-6 pb-4"} flex flex-row items-center gap-4 space-y-0`}
      >
        <Avatar className={`${isCompact ? "h-8 w-8" : "h-12 w-12"}`}>
          <AvatarImage
            src={`https://avatar.vercel.sh/${agent.email}`}
            alt={agent.name}
          />
          <AvatarFallback>
            {agent.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${isCompact ? "text-sm" : "text-lg"}`}
            >
              {agent.name}
            </h3>
            {agent.isVerified && (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {agent.reputation.toFixed(1)}
            </span>
            <span>•</span>
            <span>{agent.completedEscrows} deals</span>
          </div>
        </div>
      </CardHeader>

      {!isCompact && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Escrow Agent
            </Badge>
            {agent.reputation > 4.5 && (
              <Badge
                variant="outline"
                className="text-xs border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
              >
                Top Rated
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
