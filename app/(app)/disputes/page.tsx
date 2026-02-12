"use client";

import { useEffect } from "react";

import { DisputeList } from "@/components/disputes/dispute-list";
import { NewDisputeModal } from "@/components/disputes/new-dispute-modal";

import { useDisputeStore } from "@/lib/store/dispute.store";

export default function DisputesPage() {
  const { disputes, isLoading, fetchDisputes } = useDisputeStore();

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispute Center</h1>
          <p className="text-muted-foreground">
            View and manage your transaction disputes.
          </p>
        </div>
        <NewDisputeModal />
      </div>

      <div className="space-y-4">
        <DisputeList disputes={disputes} isLoading={isLoading} />
      </div>
    </div>
  );
}
