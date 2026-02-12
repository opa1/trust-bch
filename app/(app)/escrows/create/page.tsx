import { CreateEscrowForm } from "@/components/escrows/create-escrow-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Escrow | TrustBCH",
  description: "Create a new secure escrow transaction.",
};

export default function CreateEscrowPage() {
  return (
    <div className="container mx-auto md:px-4 md:py-8">
      <CreateEscrowForm />
    </div>
  );
}
