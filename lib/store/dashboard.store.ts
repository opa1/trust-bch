import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Escrow } from "@prisma/client";

interface DashboardData {
  // Data
  escrows: Escrow[];
  walletBalance: number;
  successRate: number;

  // Computed (derived from escrows)
  activeEscrowsCount: number;
  completedEscrowsCount: number;

  // Meta
  lastFetchedAt: number | null; // timestamp
  isLoading: boolean;
  isRefreshing: boolean; // true when refreshing in background (has cached data)
  hasData: boolean; // true if store has been populated at least once
}

interface DashboardActions {
  setEscrows: (escrows: Escrow[]) => void;
  setWalletBalance: (balance: number) => void;
  setSuccessRate: (rate: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRefreshing: (refreshing: boolean) => void;
  updateDashboard: (data: Partial<DashboardData>) => void;
  clearDashboard: () => void; // Call on logout
  shouldRefetch: () => boolean; // Returns true if data is stale
}

type DashboardStore = DashboardData & DashboardActions;

const STALE_TIME = 60 * 1000; // 1 minute - data older than this will be refreshed

const initialState: DashboardData = {
  escrows: [],
  walletBalance: 0,
  successRate: 0,
  activeEscrowsCount: 0,
  completedEscrowsCount: 0,
  lastFetchedAt: null,
  isLoading: false,
  isRefreshing: false,
  hasData: false,
};

// Helper to compute derived counts from escrows
function computeCounts(escrows: Escrow[]) {
  const activeEscrowsCount = escrows.filter((e) =>
    [
      "created",
      "awaiting_funding",
      "funded",
      "disputed",
      "in_progress",
      "submitted",
      "verified",
      "funding_in_progress",
    ].includes(e.status.toLowerCase()),
  ).length;

  const completedEscrowsCount = escrows.filter((e) =>
    ["released", "refunded", "completed"].includes(e.status.toLowerCase()),
  ).length;

  return { activeEscrowsCount, completedEscrowsCount };
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setEscrows: (escrows) =>
        set({
          escrows,
          ...computeCounts(escrows),
        }),

      setWalletBalance: (walletBalance) => set({ walletBalance }),

      setSuccessRate: (successRate) => set({ successRate }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsRefreshing: (isRefreshing) => set({ isRefreshing }),

      updateDashboard: (data) => {
        const escrows = data.escrows ?? get().escrows;
        set({
          ...data,
          ...computeCounts(escrows),
          lastFetchedAt: Date.now(),
          hasData: true,
          isLoading: false,
          isRefreshing: false,
        });
      },

      clearDashboard: () => set(initialState),

      shouldRefetch: () => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return true;
        return Date.now() - lastFetchedAt > STALE_TIME;
      },
    }),
    {
      name: "dashboard-store", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist data fields, not loading states
      partialize: (state) => ({
        escrows: state.escrows,
        walletBalance: state.walletBalance,
        successRate: state.successRate,
        activeEscrowsCount: state.activeEscrowsCount,
        completedEscrowsCount: state.completedEscrowsCount,
        lastFetchedAt: state.lastFetchedAt,
        hasData: state.hasData,
      }),
    },
  ),
);
