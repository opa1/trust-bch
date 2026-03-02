"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, Star, Workflow, Bitcoin, Bell, Code } from "lucide-react";
import { motion } from "framer-motion";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Why Choose TrustBCH?
          </h2>
          <p className="text-muted-foreground text-lg">
            We combine the power of AI verification with the speed of Bitcoin
            Cash to ensure every peer-to-peer transaction is secure and
            trustworthy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-primary" />}
            title="Agentic AI Verification"
            description="Automated work validation providing instant feedback and confidence scores for submitted work."
            delay={0.1}
          />
          <FeatureCard
            icon={<Star className="h-10 w-10 text-primary" />}
            title="Dynamic Trust Score"
            description="Sophisticated reputation system incorporating success rates, volume, and AI-validated metrics."
            delay={0.2}
          />
          <FeatureCard
            icon={<Workflow className="h-10 w-10 text-primary" />}
            title="Strict State Machine"
            description="Robust escrow lifecycle management with exhaustive audit trails for secure and trustworthy transactions."
            delay={0.3}
          />
          <FeatureCard
            icon={<Bitcoin className="h-10 w-10 text-primary" />}
            title="BCH Integration"
            description="Seamless Bitcoin Cash operations including address generation, funding detection, and automated payouts."
            delay={0.4}
          />
          <FeatureCard
            icon={<Bell className="h-10 w-10 text-primary" />}
            title="Real-time Notifications"
            description="Instant alerts for all critical escrow events including funding, submissions, disputes, and releases."
            delay={0.5}
          />
          <FeatureCard
            icon={<Code className="h-10 w-10 text-primary" />}
            title="Developer API"
            description="Integrate TrustBCH escrow directly into your marketplace or application with our easy-to-use API."
            delay={0.6}
            comingSoon={true}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  comingSoon?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay }}
      className="h-full"
    >
      <Card className="border border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm h-full flex flex-col">
        <CardContent className="p-6 pt-8 space-y-4 flex flex-col h-full items-center text-center">
          <div className="p-3 bg-primary/10 w-fit rounded-xl mb-4">{icon}</div>
          <div className="flex items-center gap-2 justify-center">
            <h3 className="text-xl font-bold">{title}</h3>
            {comingSoon && (
              <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary/20">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed flex-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
