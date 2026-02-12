"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser, setInitialized } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await apiClient.getCurrentUser();

        if (response?.user) {
          setUser(response.user);
        } else {
          clearUser();
        }
      } catch (error) {
        clearUser();
      } finally {
        setInitialized(true);
      }
    };

    initAuth();
  }, [setUser, clearUser, setInitialized]);

  return <>{children}</>;
}
