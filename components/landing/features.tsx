"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Lock, RefreshCw, Users, Code } from "lucide-react";
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
            We combine the speed of Bitcoin Cash with robust security features
            to ensure every transaction is safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Secure Escrow"
            description="Funds are held in a secure multi-sig smart contract until both parties are satisfied. No more scams."
            delay={0.1}
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Agent Mediation"
            description="Professional agents are available to mediate disputes fairly and quickly if anything goes wrong."
            delay={0.2}
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-primary" />}
            title="Instant Settlements"
            description="Enjoy the lightning-fast speed of Bitcoin Cash. Funds are released immediately upon approval."
            delay={0.3}
          />
          <FeatureCard
            icon={<Lock className="h-10 w-10 text-primary" />}
            title="Encrypted Chat"
            description="Communicate securely with your counterparty directly within the platform. Your privacy is our priority."
            delay={0.4}
          />
          <FeatureCard
            icon={<RefreshCw className="h-10 w-10 text-primary" />}
            title="Real-time Tracking"
            description="Track the status of your transaction at every step with real-time notifications and updates."
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
