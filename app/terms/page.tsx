import { LandingNavbar } from "@/components/landing/navbar";
import { FooterSection } from "@/components/landing/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TrustBCH",
  description: "Terms of Service for TrustBCH",
};

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-24 md:px-6">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="space-y-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using TrustBCH, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              TrustBCH provides a decentralized escrow platform built on Bitcoin Cash. We facilitate secure transactions 
              between parties by holding funds in escrow and providing dispute resolution services through our network of agents.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Conduct</h2>
            <p>
              You agree to use the service only for lawful purposes. You are prohibited from using the service to facilitate 
              any illegal activities, including but not limited to money laundering, fraud, or the sale of illicit goods.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Escrow and Disputes</h2>
            <p>
              Funds placed in escrow are held until the terms of the transaction are met. In the event of a dispute, 
              both parties agree to enter into the platform's dispute resolution process, mediated by our assigned agents. 
              The decision of the agent in a dispute is final.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "as is" and "as available" basis. TrustBCH expressly disclaims all warranties 
              of any kind, whether express or implied, including, but not limited to the implied warranties of merchantability, 
              fitness for a particular purpose and non-infringement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>
              TrustBCH shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, 
              resulting from the use or the inability to use the service or any other matter relating to the service.
            </p>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
