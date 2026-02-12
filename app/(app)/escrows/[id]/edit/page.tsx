import { EditEscrowForm } from "@/components/escrows/edit-escrow-form";
import { getEscrow } from "@/services/escrow.service";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { NextRequest } from "next/server";

export const metadata: Metadata = {
  title: "Edit Escrow | TrustBCH",
  description: "Edit your escrow details.",
};

interface EditEscrowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEscrowPage({ params }: EditEscrowPageProps) {
  const { id } = await params;

  // We need to verify auth manually in Server Component if not using lightweight wrapper
  // Using verifyAuth with a dummy request object created from headers is one way,
  // or better, extract userId from cookie if verifying signature manually.
  // BUT verifyAuth expects NextRequest.
  // Ideally we should use a session retrieval method for Server Components.
  // As a workaround, we can check if `api-client` (which runs in client) or middleware protected this route.
  // The layout has `ProtectedRoute` but that's Client Side.
  // For Server Side data fetching, we should verify auth.

  // Actually, `getEscrow` requires `userId`.
  // We need to decode the token from cookies.

  const headersList = await headers();
  const cookieStore = headersList.get("cookie");

  // We can construct a minimal request object or use a helper that parses cookie string
  // `verifyAuth` logic: checks `req.cookies.get("auth_token")`.
  // We can mock this.

  // However, simpler way: use `api-client` on server? No.
  // Let's rely on `verifyAuth` by constructing a request.
  // Or since we are in `app` dir, we can assume protected by Middleware if it exists.
  // But we need `userId`.

  // Let's duplicate basic token extraction or modify verifyAuth to accept cookie store?
  // `verifyAuth` imports `verifyToken`.
  // We can use `verifyToken` directly!

  const { verifyToken } = require("@/lib/utils/jwt"); // Dynamically require to avoid 'fs' issues if any? No, standard import is fine.
  // Actually verifyToken is exported from lib/utils/jwt.ts.
  // I need to read the cookie manually.

  const token = getCookieValue(cookieStore || "", "auth_token");

  let userId: string | undefined;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      userId = payload.userId;
    }
  }

  if (!userId) {
    redirect("/login");
  }

  const escrow = await getEscrow(id, userId);

  if (!escrow) {
    notFound();
  }

  // Check if editable (Security check)
  // Only CREATED or AWAITING_FUNDING
  // And only Buyer should edit? Or Seller too?
  // Logic: "Updates" usually involve description/amount correction.
  // If Seller edits amount, they might try to increase it?
  // If Buyer edits amount, they verify what they pay.
  // Let's assume ONLY Buyer can edit for now as per "Create Escrow" flow.

  const isBuyer = escrow.buyerUserId === userId;
  if (!isBuyer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only the buyer can edit this escrow.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-2">
          Edit Escrow
        </h1>
        <p className="text-muted-foreground">
          Modify the details of {escrow.escrowId}.
        </p>
      </div>

      <EditEscrowForm
        escrow={{
          id: escrow.id,
          description: escrow.description,
          amountBCH: escrow.amountBCH,
          status: escrow.status,
        }}
      />
    </div>
  );
}

// Helper to parse cookie string
function getCookieValue(cookieString: string, key: string): string | undefined {
  const match = cookieString.match(new RegExp(`(^| )${key}=([^;]+)`));
  return match ? match[2] : undefined;
}
