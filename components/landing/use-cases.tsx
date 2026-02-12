"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function UseCasesSection() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center justify-items-center text-center">
          <div className="space-y-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center">
              Perfect for Every Transaction
            </h2>
            <div className="space-y-6">
              <UseCaseItem
                title="Freelancers & Clients"
                description="Ensure payment for your work and delivery for your payments. Perfect for milestones and gig work."
              />
              <UseCaseItem
                title="E-commerce Marketplaces"
                description="Add a layer of trust to peer-to-peer marketplaces. Protect buyers from non-delivery and sellers from chargebacks."
              />
              <UseCaseItem
                title="Digital Goods Trading"
                description="Safely trade accounts, domains, or in-game items without fear of being scammed."
              />
              <UseCaseItem
                title="OTC Crypto Trades"
                description="Securely swap assets with other individuals with the safety of a mediator."
              />
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full aspect-square max-w-md mx-auto lg:max-w-none lg:mx-0"
          >
            {/* Abstract Decorative Background */}
            <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl transform rotate-3 scale-95 opacity-70"></div>

            <Card className="relative bg-card/80 backdrop-blur-sm border-muted shadow-2xl overflow-hidden rounded-2xl h-full flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-8">
                {/* Visual Icon Group */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150"></div>
                  <div className="relative bg-background border border-border p-6 rounded-full shadow-lg">
                    <Shield className="w-16 h-16 text-primary" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full border border-background shadow-sm">
                    SECURE
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Escrow Protection</h3>
                  <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                    Funds are held safely until both parties are satisfied. No
                    more scams or chargebacks.
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-muted p-3 rounded-xl flex flex-col items-center gap-2 border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium">
                      Active Monitoring
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded-xl flex flex-col items-center gap-2 border border-border/50">
                    <Shield className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium">Agent Mediated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function UseCaseItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="mt-1 shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <ChevronRight className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
