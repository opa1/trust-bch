import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/lib/toast-utils";

export interface Dispute {
  id: string;
  disputeId: string;
  escrowId: string;
  reason: string;
  status: string;
  createdAt: string;
  escrow?: {
    escrowId: string;
    description: string;
    amountBCH: number;
  };
}

interface DisputeState {
  disputes: Dispute[];
  isLoading: boolean;
  lastFetched: number;
  fetchDisputes: (force?: boolean) => Promise<void>;
  invalidateDisputes: () => void;
}

const CACHE_DURATION = 60 * 1000; // 1 minute cache

export const useDisputeStore = create<DisputeState>((set, get) => ({
  disputes: [],
  isLoading: false,
  lastFetched: 0,

  fetchDisputes: async (force = false) => {
    const { lastFetched, isLoading, disputes } = get();
    const now = Date.now();

    if (
      !force &&
      !isLoading &&
      disputes.length > 0 &&
      now - lastFetched < CACHE_DURATION
    ) {
      return;
    }

    set({ isLoading: true });

    try {
      const response = await apiClient.getDisputes();
      set({
        disputes: response.data?.disputes || [],
        lastFetched: now,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      toast.error("Error", "Failed to refresh disputes");
      set({ isLoading: false });
    }
  },

  invalidateDisputes: () => {
    set({ lastFetched: 0 });
  },
}));
