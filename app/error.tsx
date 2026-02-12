"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/shared/error-content";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: number };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <ErrorContent
        code="500"
        title="Something went wrong!"
        description={
          error.message ||
          "We encountered an unexpected error. Please try again."
        }
        onRetry={reset}
      />
    </div>
  );
}
