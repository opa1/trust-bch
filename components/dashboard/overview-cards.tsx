"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  ScrollText,
  Award,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewCardsProps {
  balance: number;
  activeEscrows: number;
  reputation: number;
  completedEscrows: number;
}

export function OverviewCards({
  balance,
  activeEscrows,
  reputation,
  completedEscrows,
}: OverviewCardsProps) {
  const cards = [
    {
      title: "Wallet Balance",
      value: `${balance.toFixed(4)} BCH`,
      description: "Confirmed available funds",
      icon: Wallet,
      gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
      borderGlow: "group-hover:border-emerald-500/50",
      iconColor: "text-emerald-500",
      trend: null, // No historical data yet
    },
    {
      title: "Active Escrows",
      value: activeEscrows.toString(),
      description: "Transactions in progress",
      icon: ScrollText,
      gradient: "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
      borderGlow: "group-hover:border-blue-500/50",
      iconColor: "text-blue-500",
      trend: null,
    },
    {
      title: "Success Rate",
      value: `${reputation}%`,
      description: "Based on completed transactions",
      icon: Award,
      gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
      borderGlow: "group-hover:border-amber-500/50",
      iconColor: "text-amber-500",
      trend: null,
    },
    {
      title: "Completed",
      value: completedEscrows.toString(),
      description: "Successfully finalized escrows",
      icon: CheckCircle,
      gradient: "from-pink-500/20 via-rose-500/20 to-purple-500/20",
      borderGlow: "group-hover:border-pink-500/50",
      iconColor: "text-pink-500",
      trend: null,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/50 bg-card backdrop-blur-xl transition-all duration-300",
            card.borderGlow,
          )}
        >
          {/* Animated Gradient Background */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-linear-to-br",
              card.gradient,
            )}
          />

          {/* Subtle persistent background glow */}
          <div
            className={cn(
              "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-[60px] opacity-20",
              card.gradient.replace("/20", ""),
            )}
          />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "rounded-xl p-2.5 bg-background/80 shadow-sm ring-1 ring-inset ring-border/20",
                  card.iconColor,
                )}
              >
                <card.icon className="h-6 w-6" />
              </div>
              {card.trend && (
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                  {card.trend}
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-medium text-muted-foreground tracking-wide uppercase text-xs">
                {card.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {card.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
                {card.description}
              </p>
            </div>
          </div>

          {/* Bottom decorative line */}
          <div
            className={cn(
              "absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full bg-linear-to-r",
              card.gradient.replace("/20", ""),
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}
