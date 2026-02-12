"use client";

import { AgentCard } from "./agent-card";
import { Card, CardContent } from "@/components/ui/card";

// Mock data integration - ideally props or fetched internally
interface AssignedAgentsListProps {
  agents?: any[];
}

export function AssignedAgentsList({ agents = [] }: AssignedAgentsListProps) {
  if (agents.length === 0) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
          <p>You don't have any active agents assigned to your escrows.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} variant="compact" />
      ))}
    </div>
  );
}
