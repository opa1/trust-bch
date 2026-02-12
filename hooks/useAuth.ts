import { useAuthStore, User } from "@/lib/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    status,
    isInitialized,
    setUser,
    clearUser,
  } = useAuthStore();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.user) {
        setUser(response.user);
      } else {
        clearUser();
      }
    } catch (error) {
      clearUser();
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const response = await apiClient.login(credentials);
    setUser(response.user);
    return response;
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    const response = await apiClient.register(data);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await apiClient.logout();
    clearUser();
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    status,
    isInitialized,
    login,
    register,
    logout,
    checkAuth,
  };
}
