"use client";

import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar"; // Reuse sidebar content for mobile
import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScrollText,
  Users,
  AlertCircle,
  User,
  LogOut,
  Settings,
} from "lucide-react";

// Duplicate items for mobile menu since we can't easily reuse the exact desktop sidebar component structure
const sidebarItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Escrows", href: "/escrows", icon: ScrollText },

  { title: "Disputes", href: "/disputes", icon: AlertCircle },
  { title: "Profile", href: "/profile", icon: User },
];

import { useNotifications } from "@/components/notifications/notification-provider";
import { Bell } from "lucide-react";

// ... inside TopNav component
export function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-muted/40 px-4 lg:h-15 lg:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold md:hidden"
      >
        <Logo width={100} height={28} />
      </Link>
      <div className="flex-1 md:ml-4"></div>

      {isAuthenticated && (
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      )}

      <ThemeToggle />
      <UserMenu
        isAuthenticated={isAuthenticated}
        userName={user?.fullName}
        userEmail={user?.email}
      />
    </header>
  );
}
