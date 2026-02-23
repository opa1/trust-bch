"use client";

import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PendingEscrowsTable } from "@/components/dashboard/pending-escrows-table";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const {
    escrows,
    walletBalance,
    successRate,
    activeEscrowsCount,
    completedEscrowsCount,
    isLoading,
    isRefreshing,
    lastFetchedAt,
    refresh,
  } = useDashboardData();

  return (
    <div className="flex flex-col gap-6">
      {/* Optional: Show subtle refresh indicator */}
      {isRefreshing && (
        <div className="text-xs text-muted-foreground text-right animate-pulse">
          Refreshing data...
        </div>
      )}

      {/* Optional: Show last updated time */}
      {/* {lastFetchedAt && !isRefreshing && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {new Date(lastFetchedAt).toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      )} */}

      {/* Overview Cards - shows cached data instantly, no flash of zeros */}
      <OverviewCards
        balance={walletBalance}
        activeEscrows={activeEscrowsCount}
        reputation={successRate}
        completedEscrows={completedEscrowsCount}
      />

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Content */}
        <div className="md:col-span-4 lg:col-span-5 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Active Escrows
          </h2>

          <PendingEscrowsTable
            escrows={escrows.filter((e) =>
              [
                "created",
                "awaiting_funding",
                "funded",
                "disputed",
                "funding_in_progress",
              ].includes(e.status.toLowerCase()),
            )}
            isLoading={isLoading} // Only skeleton on first ever load
          />
        </div>

        {/* Sidebar */}
        <div className="md:col-span-3 lg:col-span-2 space-y-4">
          <NotificationsPanel />
        </div>
      </div>
    </div>
  );
}
