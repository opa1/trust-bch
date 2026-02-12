"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AgentCard } from "@/components/agents/agent-card";
import { ApplyAsAgentForm } from "@/components/agents/apply-as-agent-form";
import { AssignedAgentsList } from "@/components/agents/assigned-agents-list";
import { Separator } from "@/components/ui/separator";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getAgents();
        // Handle response depending on structure (e.g. data.agents or just data)
        setAgents(Array.isArray(data) ? data : data.agents || []);
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents Network</h1>
          <p className="text-muted-foreground">
            Browse verified agents for your escrow transactions.
          </p>
        </div>
        <ApplyAsAgentForm />
      </div>

      {/* Assigned Agents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Your Active Agents
        </h2>
        <AssignedAgentsList agents={[]} />
        {/* TODO: Pass actual assigned agents when API supports it */}
      </div>

      <Separator />

      {/* All Agents Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Available Agents
        </h2>
        {agents.length === 0 ? (
          <p className="text-muted-foreground">
            No agents found in the network yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
