"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 120, height = 40 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return dark logo as default during SSR
    return (
      <Image
        src="/app/images/logo-dark.svg"
        alt="TrustBCH"
        width={width}
        height={height}
        className={cn("select-none", className)}
        priority
      />
    );
  }

  return (
    <Image
      src={
        resolvedTheme === "dark"
          ? "/app/images/logo.svg"
          : "/app/images/logo-dark.svg"
      }
      alt="TrustBCH"
      width={width}
      height={height}
      className={cn("select-none", className)}
      priority
    />
  );
}
