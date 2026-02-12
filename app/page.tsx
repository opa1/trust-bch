import { LandingPage } from "@/components/landing-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrustBCH | Secure Bitcoin Cash Escrow Platform",
  description:
    "The most secure, fast, and low-fee escrow service for Bitcoin Cash. Protect your transactions with automated and agent-mediated escrow.",
  keywords:
    "Bitcoin Cash, BCH, Escrow, Crypto Payment, Secure Transaction, Freelance, E-commerce",
};

export default function Page() {
  return <LandingPage />;
}
