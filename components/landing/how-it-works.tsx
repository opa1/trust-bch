"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-28 bg-background relative"
    >
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            How TrustBCH Works
          </h2>
          <p className="text-muted-foreground text-lg">
            A seamless flow designed to protect both buyers and sellers.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 relative">
          {/* Connecting Line (Desktop) - Improved Alignment */}
          <div className="hidden lg:block absolute top-[2.5rem] left-0 right-0 h-0.5 bg-border -z-10 translate-y-1/2 w-full max-w-[80%] mx-auto"></div>

          <StepCard
            number="01"
            title="Create Agreement"
            description="Seller creates a transaction with clear terms and price."
            delay={0.1}
          />
          <StepCard
            number="02"
            title="Buyer Deposits"
            description="Buyer reviews terms and deposits BCH into the secure escrow."
            delay={0.2}
          />
          <StepCard
            number="03"
            title="Work / Delivery"
            description="Seller delivers goods or services as agreed."
            delay={0.3}
          />
          <StepCard
            number="04"
            title="Funds Released"
            description="Buyer approves the work, and funds are instantly released."
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center text-center space-y-4 z-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay }}
    >
      <div className="h-16 w-16 rounded-full bg-background border-4 border-primary/20 text-primary flex items-center justify-center text-2xl font-bold shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground max-w-[250px]">{description}</p>
    </motion.div>
  );
}
