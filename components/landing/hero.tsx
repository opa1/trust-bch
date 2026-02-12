"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion, Variants } from "framer-motion";

export function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-32 lg:pt-40 lg:pb-40">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-background z-10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-77.5 w-77.5 rounded-full bg-primary/20 opacity-30 blur-[100px]"></div>
        <div className="absolute inset-0 bg-background/80 mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,transparent_0%,var(--background)_100%)]"></div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-background to-background"></div>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-medium border-primary/30 text-primary bg-primary/5 rounded-full mb-4"
            >
              🚀 The Future of Secure BCH Transactions
            </Badge>
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-extrabold tracking-tight lg:text-6xl text-foreground"
          >
            Trustless Payments, <br className="hidden md:block" />
            <span className="text-primary bg-clip-text bg-linear-to-r from-primary to-accent">
              Guaranteed Security.
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-175 leading-relaxed mx-auto"
          >
            The premier escrow platform for Bitcoin Cash. Buy, sell, and trade
            with confidence using our automated and agent-mediated dispute
            resolution system.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              asChild
            >
              <Link href="/dashboard">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-lg rounded-full border-2 hover:bg-muted/50"
              asChild
            >
              <Link href="#how-it-works">How it Works</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Abstract Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10"
      />
    </section>
  );
}
