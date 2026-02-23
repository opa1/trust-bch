"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScrollText,
  Users,
  AlertCircle,
  User,
  Compass,
} from "lucide-react";

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Escrows",
    href: "/escrows",
    icon: ScrollText,
  },
  // {
  //   title: "Disputes",
  //   href: "/disputes",
  //   icon: AlertCircle,
  // },
  {
    title: "Discover",
    href: "/discover",
    icon: Compass,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-4 backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "rounded-full p-1 transition-all",
                isActive && "bg-primary/10",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
