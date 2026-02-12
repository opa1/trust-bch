"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EscrowList } from "@/components/escrows/escrow-list";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEscrowStore, Escrow } from "@/lib/store/escrow.store";

export default function EscrowsPage() {
  const router = useRouter();
  const { escrows, isLoading, fetchEscrows } = useEscrowStore();
  const [filteredEscrows, setFilteredEscrows] = useState<Escrow[]>([]);
  const [currentTab, setCurrentTab] = useState("all");

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  useEffect(() => {
    if (currentTab === "all") {
      setFilteredEscrows(escrows);
    } else {
      setFilteredEscrows(
        escrows.filter((e) => {
          const status = e.status.toLowerCase();
          if (currentTab === "active") {
            return ["created", "funded", "disputed"].includes(status);
          }
          if (currentTab === "completed") {
            return ["released", "refunded", "completed"].includes(status);
          }
          if (currentTab === "disputed") {
            return status === "disputed";
          }
          return true;
        }),
      );
    }
  }, [currentTab, escrows]);

  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escrows</h1>
          <p className="text-muted-foreground">
            Manage your secure transactions
          </p>
        </div>

        <Button
          onClick={() => router.push("/escrows/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Escrow
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* We reuse the Tabs UI logic but manage state here for filtering */}
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <div className="w-full overflow-x-auto pb-1">
            <TabsList className="w-full sm:w-auto justify-start">
              <TabsTrigger value="all">All Escrows</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <EscrowList
          escrows={filteredEscrows}
          isLoading={isLoading}
          onActionComplete={() => fetchEscrows(true)}
        />
      </div>
    </div>
  );
}
