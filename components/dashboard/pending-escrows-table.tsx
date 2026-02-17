"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Escrow {
  id: string;
  escrowId: string;
  description: string;
  amountBCH: number;
  status: string;
  createdAt: string;
}

interface PendingEscrowsTableProps {
  escrows: Escrow[] | any[];
  isLoading: boolean;
}

export function PendingEscrowsTable({
  escrows,
  isLoading,
}: PendingEscrowsTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      created: { variant: "secondary", label: "Created" },
      funded: { variant: "default", label: "Funded" },
      released: { variant: "success", label: "Released" },
      refunded: { variant: "warning", label: "Refunded" },
      disputed: { variant: "destructive", label: "Disputed" },
      completed: { variant: "success", label: "Completed" },
      expired: { variant: "outline", label: "Expired" },
    };

    const config = statusMap[status.toLowerCase()] || {
      variant: "outline",
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No active escrows found
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {escrows.map((escrow) => (
          <div
            key={escrow.id}
            onClick={() => router.push(`/escrows/${escrow.id}`)}
            className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:bg-muted/50 active:bg-muted cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{escrow.description}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(escrow.createdAt).toLocaleDateString()}
                </span>
              </div>
              {getStatusBadge(escrow.status)}
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
              <span className="font-semibold">{escrow.amountBCH} BCH</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card backdrop-blur-xl transition-all duration-300">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead>Description</TableHead>
              <TableHead>Amount (BCH)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escrows.map((escrow) => (
              <TableRow
                key={escrow.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/escrows/${escrow.id}`)}
              >
                <TableCell className="font-medium">
                  {escrow.description}
                </TableCell>
                <TableCell>{escrow.amountBCH}</TableCell>
                <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                <TableCell>
                  {new Date(escrow.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/escrows/${escrow.id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
