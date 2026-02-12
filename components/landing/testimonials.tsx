"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Trusted by the Community
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="TrustBCH saved me from a $2,000 scam. The dispute resolution process was fair and quick."
            author="Alex M."
            role="Freelance Developer"
            delay={0.1}
          />
          <TestimonialCard
            quote="The fees are incredibly low compared to other platforms, and the BCH network speed is unmatched."
            author="Sarah K."
            role="Digital Artist"
            delay={0.2}
          />
          <TestimonialCard
            quote="Finally, a user-friendly way to use crypto for real business transactions without the stress."
            author="James P."
            role="E-commerce Owner"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  delay,
}: {
  quote: string;
  author: string;
  role: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay }}
      className="h-full"
    >
      <Card className="bg-muted/30 border-none h-full flex flex-col">
        <CardContent className="p-8 space-y-6 flex flex-col h-full items-center text-center">
          <div className="flex gap-1 text-yellow-500 justify-center">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
          </div>
          <p className="text-lg italic text-muted-foreground flex-1">
            "{quote}"
          </p>
          <div className="mt-auto pt-4">
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
