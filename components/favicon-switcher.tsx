"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function FaviconSwitcher() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Get or create favicon link element
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // Update favicon based on theme
    if (resolvedTheme === "dark") {
      link.href = "/app/images/favicon-dark.ico";
    } else {
      link.href = "/app/images/favicon.ico";
    }
  }, [resolvedTheme]);

  return null; // This component doesn't render anything
}
