"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-shadow",
        isScrolled && "shadow-sm",
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo width={140} height={40} />
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/escrows"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Escrows
            </Link>

            <Link
              href="/disputes"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Disputes
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu
              isAuthenticated={isAuthenticated}
              userName={user?.fullName}
              userEmail={user?.email}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
