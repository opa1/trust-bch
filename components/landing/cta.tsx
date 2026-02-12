"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 bg-primary/5 border-y border-primary/10">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Ready to Transact Securely?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of users who trust us with their payments. No hidden
            fees, no headaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-200"
              asChild
            >
              <Link href="/dashboard">Create an Escrow Now</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4 flex items-center justify-center gap-6">
            <span className="flex items-center">
              <CheckCircle2 className="inline-block w-4 h-4 mr-2 text-primary" />
              No credit card required
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="inline-block w-4 h-4 mr-2 text-primary" />
              Instant setup
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
