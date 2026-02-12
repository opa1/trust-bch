"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // CRITICAL: NEVER redirect before initialization completes
    if (!isInitialized) {
      return;
    }

    // Only redirect when we're CERTAIN the user is NOT authenticated
    // AND we've completed initialization
    if (status === "guest" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    // Reset redirect flag when user becomes authenticated
    if (status === "authenticated") {
      hasRedirected.current = false;
    }
  }, [status, isInitialized, router, pathname]);

  // Show loading state while initializing OR checking auth
  if (!isInitialized || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {!isInitialized ? "Initializing..." : "Loading..."}
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (status === "guest") {
    return null;
  }

  return <>{children}</>;
}
