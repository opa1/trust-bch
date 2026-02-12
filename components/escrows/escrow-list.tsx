"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/escrows/status-badge";
import { EscrowActions } from "@/components/escrows/escrow-actions";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";

interface Escrow {
  id: string;
  escrowId: string;
  buyerUserId: string;
  sellerUserId: string;
  description: string;
  amountBCH: number;
  status: string;
  createdAt: string;
}

interface EscrowListProps {
  escrows: Escrow[];
  isLoading: boolean;
  onActionComplete: () => void;
}

export function EscrowList({
  escrows,
  isLoading,
  onActionComplete,
}: EscrowListProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-md bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="flex bg-card h-64 flex-col items-center justify-center border rounded-md gap-2 text-center p-8">
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-medium">No escrows found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or create a new escrow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="w-full flex flex-col gap-4 md:hidden">
        {escrows.map((escrow) => {
          const isBuyer = user?.id === escrow.buyerUserId;
          const isSeller = user?.id === escrow.sellerUserId;

          return (
            <div
              key={escrow.id}
              onClick={() => router.push(`/escrows/${escrow.id}`)}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted cursor-pointer"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {escrow.escrowId}
                  </span>
                  <span className="font-medium truncate">
                    {escrow.description}
                  </span>
                </div>
                <StatusBadge status={escrow.status} />
              </div>

              <div className="flex justify-between items-center text-sm border-t pt-3 mt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="font-semibold">{escrow.amountBCH} BCH</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span>{new Date(escrow.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount (BCH)</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escrows.map((escrow) => {
              const isBuyer = user?.id === escrow.buyerUserId;
              const isSeller = user?.id === escrow.sellerUserId;

              return (
                <TableRow
                  key={escrow.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/escrows/${escrow.id}`)}
                >
                  <TableCell className="font-mono text-xs">
                    {escrow.escrowId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {escrow.description}
                  </TableCell>
                  <TableCell>{escrow.amountBCH}</TableCell>
                  <TableCell>
                    <StatusBadge status={escrow.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(escrow.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end">
                      <EscrowActions
                        escrowId={escrow.id}
                        status={escrow.status}
                        isBuyer={isBuyer}
                        isSeller={isSeller}
                        onActionComplete={onActionComplete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
