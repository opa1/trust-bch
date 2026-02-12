"use client";

import {
  AlertTriangle,
  FileQuestion,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ErrorContentProps {
  title?: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorContent({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again later.",
  code = "500",
  onRetry,
  showHomeButton = true,
}: ErrorContentProps) {
  const router = useRouter();

  const isNotFound = code === "404";
  const Icon = isNotFound ? FileQuestion : AlertTriangle;

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {code}
        </h1>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-[500px] text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}

        {showHomeButton && (
          <Button
            variant={onRetry ? "outline" : "default"}
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
