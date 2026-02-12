"use client";

import * as React from "react";
import Link from "next/link";
import { User, LogIn, Settings, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  isAuthenticated?: boolean;
  userName?: string;
  userEmail?: string;
}

export function UserMenu({
  isAuthenticated = false,
  userName,
  userEmail,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {getInitials(userName)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium">{userName || "User"}</p>
            <p className="text-xs text-muted-foreground">
              {userEmail || "user@example.com"}
            </p>
          </div>
          <div className="py-2">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors",
              )}
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors",
              )}
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
          <div className="border-t border-border py-2">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
