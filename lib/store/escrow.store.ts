import { create } from "zustand";
import { apiClient } from "@/lib/api-client"; // Assuming apiClient handles the actual fetching
import { toast } from "@/lib/toast-utils";

export interface Escrow {
  id: string;
  escrowId: string;
  buyerUserId: string;
  sellerUserId: string;
  description: string;
  amountBCH: number;
  status: string;
  role: "buyer" | "seller";
  fundedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
  disputes?: any[];
}

interface EscrowState {
  escrows: Escrow[];
  isLoading: boolean;
  lastFetched: number;
  fetchEscrows: (force?: boolean) => Promise<void>;
  invalidateEscrows: () => void;
}

const CACHE_DURATION = 60 * 1000; // 1 minute cache

export const useEscrowStore = create<EscrowState>((set, get) => ({
  escrows: [],
  isLoading: false,
  lastFetched: 0,

  fetchEscrows: async (force = false) => {
    const { lastFetched, isLoading, escrows } = get();
    const now = Date.now();

    // Return cached data if valid and not forcing refresh
    if (
      !force &&
      !isLoading &&
      escrows.length > 0 &&
      now - lastFetched < CACHE_DURATION
    ) {
      return;
    }

    set({ isLoading: true });

    try {
      const response = await apiClient.getUserEscrows();

      set({
        escrows: response.data?.escrows || [],
        lastFetched: now,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch escrows:", error);
      toast.error("Error", "Failed to refresh escrows");
      set({ isLoading: false });
    }
  },

  invalidateEscrows: () => {
    set({ lastFetched: 0 });
  },
}));
