"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EscrowFilterTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function EscrowFilterTabs({
  currentTab,
  onTabChange,
}: EscrowFilterTabsProps) {
  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Escrows</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="disputed">Disputed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
