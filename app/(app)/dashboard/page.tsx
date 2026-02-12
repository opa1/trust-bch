"use client";

import * as React from "react";
import { apiClient } from "@/lib/api-client";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PendingEscrowsTable } from "@/components/dashboard/pending-escrows-table";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

export default function DashboardPage() {
  const [escrows, setEscrows] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch real data
        const escrowsResponse = await apiClient.getUserEscrows();
        setEscrows(escrowsResponse.escrows || []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate stats from real data
  const totalBalance = escrows.reduce(
    (acc, curr) => acc + (curr.amountBCH || 0),
    0,
  );
  const activeEscrowsCount = escrows.filter((e) =>
    ["created", "awaiting_funding", "funded", "disputed"].includes(
      e.status.toLowerCase(),
    ),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <OverviewCards
        balance={totalBalance}
        activeEscrows={activeEscrowsCount}
        reputation={100} // Mock for now until reputation API exists
        agentCount={0} // Mock for now
      />

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Content (Table) - spans 4 cols on medium, 5 cols on large */}
        <div className="md:col-span-4 lg:col-span-5 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Active Escrows
          </h2>
          <PendingEscrowsTable
            escrows={escrows.filter((e) =>
              ["created", "awaiting_funding", "funded", "disputed"].includes(
                e.status.toLowerCase(),
              ),
            )}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar (Notifications) - spans 3 cols on medium, 2 cols on large */}
        <div className="md:col-span-3 lg:col-span-2 space-y-4">
          <NotificationsPanel />
        </div>
      </div>
    </div>
  );
}
