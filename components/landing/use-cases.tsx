"use client";

import {
  Shield,
  ChevronRight,
  Briefcase,
  ShoppingCart,
  Gamepad2,
  ArrowRightLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "../logo";

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 lg:py-28 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-5 xl:grid-cols-2 gap-12 lg:gap-24 items-center justify-items-center text-center">
          <div className="space-y-8 flex flex-col items-center lg:col-span-2 xl:col-span-1">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center sm:text-left">
              Perfect for Every Transaction
            </h2>
            <div className="space-y-6">
              <UseCaseItem
                icon={<Briefcase className="w-5 h-5 text-primary" />}
                title="Freelancers & Clients"
                description="Ensure payment for your work and delivery for your payments. Perfect for milestones and gig work."
              />
              <UseCaseItem
                icon={<ShoppingCart className="w-5 h-5 text-primary" />}
                title="E-commerce Marketplaces"
                description="Add a layer of trust to peer-to-peer marketplaces. Protect buyers from non-delivery and sellers from chargebacks."
              />
              <UseCaseItem
                icon={<Gamepad2 className="w-5 h-5 text-primary" />}
                title="Digital Goods Trading"
                description="Safely trade accounts, domains, or in-game items without fear of being scammed."
              />
              <UseCaseItem
                icon={<ArrowRightLeft className="w-5 h-5 text-primary" />}
                title="OTC Crypto Trades"
                description="Securely swap assets with other individuals with the safety of a mediator."
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full aspect-square max-w-md mx-auto flex items-center justify-center my-10 lg:max-w-md lg:mx-0 lg:my-0 lg:col-span-3 xl:col-span-1"
          >
            {/* Abstract Decorative Background */}
            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-accent/5 rounded-full blur-3xl opacity-70"></div>

            {/* Circular dashed tracks */}
            <div className="absolute inset-8 sm:inset-4 rounded-full border border-dashed border-primary/20 animate-[spin_40s_linear_infinite]"></div>
            <div className="absolute inset-20 sm:inset-16 rounded-full border border-dashed border-accent/20 animate-[spin_30s_linear_infinite_reverse]"></div>

            {/* Central TrustBCH Node */}
            <motion.div
              className="relative z-10 bg-background/80 backdrop-blur-xl border border-border/50 p-6 rounded-full shadow-2xl flex flex-col items-center justify-center space-y-2 h-36 w-36 sm:h-48 sm:w-48"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-transparent to-accent/20 rounded-full animate-pulse blur-xl opacity-50"></div>
              <div className="flex flex-col items-center text-center">
                <Logo />
              </div>
            </motion.div>

            {/* Orbiting Wrapper */}
            <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
              {/* Floating Icons for Use Cases */}
              {/* Top Left - Freelancers & Clients - Angle: ~225° */}
              <FloatingNode
                className="absolute top-[15%] left-[15%] sm:top-[12%] sm:left-[12%]"
                icon={<Briefcase className="w-6 h-6 text-primary" />}
                label="Freelancers"
                delay={0}
              />

              {/* Top Right - E-commerce - Angle: ~315° */}
              <FloatingNode
                className="absolute top-[15%] right-[15%] sm:top-[12%] sm:right-[12%]"
                icon={<ShoppingCart className="w-6 h-6 text-primary" />}
                label="E-commerce"
                delay={0.2}
              />

              {/* Bottom Left - OTC Trades - Angle: ~135° */}
              <FloatingNode
                className="absolute bottom-[15%] left-[15%] sm:bottom-[12%] sm:left-[12%]"
                icon={<ArrowRightLeft className="w-6 h-6 text-primary" />}
                label="OTC Trades"
                delay={0.6}
              />

              {/* Bottom Right - Digital Goods - Angle: ~45° */}
              <FloatingNode
                className="absolute bottom-[15%] right-[15%] sm:bottom-[12%] sm:right-[12%]"
                icon={<Gamepad2 className="w-6 h-6 text-primary" />}
                label="Digital Goods"
                delay={0.4}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function UseCaseItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 text-left items-start">
      <div className="mt-1 shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-xl font-semibold">{title}</h4>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FloatingNode({
  icon,
  label,
  className,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
  delay: number;
}) {
  return (
    // Absolute positioning container on the spinning track
    <div className={`absolute ${className}`}>
      {/* 
        This motion div counter-rotates matching the exact speed of the parent's rotation.
        This ensures the icon and text always stay perfectly upright while orbiting.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", delay, duration: 0.6 }}
        className="group flex flex-col items-center justify-center animate-[spin-reverse_40s_linear_infinite]"
      >
        <motion.div
          className="bg-background border border-border shadow-lg p-3 sm:p-4 rounded-2xl flex items-center justify-center relative overflow-hidden h-12 w-12 sm:h-16 sm:w-16 cursor-pointer"
          whileHover={{ y: -5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
          {icon}
        </motion.div>
        <span className="text-[10px] sm:text-xs font-medium bg-background/80 backdrop-blur-md px-2 py-1 rounded-md border border-border/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity absolute top-[115%] whitespace-nowrap z-20 pointer-events-none">
          {label}
        </span>
      </motion.div>
    </div>
  );
}
