import * as React from "react";
import { apiClient } from "@/lib/api-client";
import { useDashboardStore } from "@/lib/store/dashboard.store";

export function useDashboardData() {
  const store = useDashboardStore();

  const fetchDashboardData = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const { silent = false } = options || {};

      // If we have cached data and this is a background refresh,
      // use isRefreshing instead of isLoading (no blank state flash)
      if (store.hasData && silent) {
        store.setIsRefreshing(true);
      } else if (!store.hasData) {
        store.setIsLoading(true);
      }

      try {
        // Fetch all data in parallel for speed
        const [escrowsResult, balanceResult, userResult] =
          await Promise.allSettled([
            apiClient.getUserEscrows(),
            apiClient.getWalletBalance(),
            apiClient.getCurrentUser(),
          ]);

        // Parse escrows
        let escrows = store.escrows; // Fall back to cached if fetch fails
        if (escrowsResult.status === "fulfilled") {
          escrows = escrowsResult.value?.data?.escrows || [];
        } else {
          console.error(
            "[Dashboard] Failed to fetch escrows:",
            escrowsResult.reason,
          );
        }

        // Parse balance
        let walletBalance = store.walletBalance; // Fall back to cached
        if (balanceResult.status === "fulfilled") {
          const balanceData = balanceResult.value?.data || balanceResult.value;
          walletBalance = balanceData?.confirmed || balanceData?.balance || 0;
        } else {
          console.error(
            "[Dashboard] Failed to fetch balance:",
            balanceResult.reason,
          );
        }

        // Parse success rate
        let successRate = store.successRate; // Fall back to cached
        if (userResult.status === "fulfilled") {
          const userData =
            userResult.value?.user ||
            userResult.value?.data ||
            userResult.value;
          successRate = userData?.successRate || 0;
        } else {
          console.error("[Dashboard] Failed to fetch user:", userResult.reason);
        }

        // Update store with fresh data
        store.updateDashboard({
          escrows,
          walletBalance,
          successRate,
        });

        console.log("[Dashboard] Data refreshed successfully");
      } catch (error) {
        console.error("[Dashboard] Failed to load dashboard data:", error);
      } finally {
        store.setIsLoading(false);
        store.setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React.useEffect(() => {
    if (!store.hasData) {
      // No cached data = full load
      fetchDashboardData({ silent: false });
    } else if (store.shouldRefetch()) {
      // Has cached data but stale = silent background refresh
      fetchDashboardData({ silent: true });
    }
    // Has fresh cached data = do nothing, just show cached
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Data
    escrows: store.escrows,
    walletBalance: store.walletBalance,
    successRate: store.successRate,
    activeEscrowsCount: store.activeEscrowsCount,
    completedEscrowsCount: store.completedEscrowsCount,

    // States
    isLoading: store.isLoading && !store.hasData, // Only show loading on FIRST load
    isRefreshing: store.isRefreshing, // Background refresh indicator
    hasData: store.hasData,
    lastFetchedAt: store.lastFetchedAt,

    // Actions
    refresh: () => fetchDashboardData({ silent: true }),
  };
}
