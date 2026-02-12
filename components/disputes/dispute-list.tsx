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
import { Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  createdAt: string;
  escrowDescription?: string; // Optional if we join data
}

interface DisputeListProps {
  disputes: Dispute[];
  isLoading: boolean;
}

export function DisputeList({ disputes, isLoading }: DisputeListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-md bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="flex bg-card h-64 flex-col items-center justify-center border rounded-md gap-2 text-center p-8 bg-muted/20">
        <p className="text-lg font-medium">No disputes found</p>
        <p className="text-sm text-muted-foreground">
          You don't have any active or past disputes.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "resolving":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/15 text-yellow-600 border-yellow-200"
          >
            Resolving
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/15 text-green-600 border-green-200"
          >
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRowClick = (escrowId: string) => {
    router.push(`/escrows/${escrowId}#dispute-chat`);
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="w-full flex flex-col gap-4 md:hidden">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            onClick={() => handleRowClick(dispute.escrowId)}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted cursor-pointer"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col gap-1 overflow-hidden flex-1">
                <span className="font-mono text-xs text-muted-foreground truncate">
                  Dispute: {dispute.id.substring(0, 8)}...
                </span>
                <span className="font-medium truncate">
                  {dispute.escrowDescription ||
                    `Escrow: ${dispute.escrowId.substring(0, 8)}...`}
                </span>
              </div>
              {getStatusBadge(dispute.status)}
            </div>

            <div className="text-sm bg-muted/50 p-2 rounded-md">
              <span className="font-semibold text-xs text-muted-foreground block mb-1">
                Reason
              </span>
              {dispute.reason}
            </div>

            <div className="flex justify-between items-center text-sm border-t pt-3 mt-1">
              <span className="text-xs text-muted-foreground">Opened</span>
              <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead>Dispute ID</TableHead>
              <TableHead>Escrow</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Opened</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map((dispute) => (
              <TableRow
                key={dispute.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(dispute.escrowId)}
              >
                <TableCell className="font-mono text-xs">
                  {dispute.id.substring(0, 8)}...
                </TableCell>
                <TableCell className="font-medium">
                  {dispute.escrowDescription ||
                    dispute.escrowId.substring(0, 8) + "..."}
                </TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={dispute.reason}
                >
                  {dispute.reason}
                </TableCell>
                <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                <TableCell>
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">View</span>
                    <ArrowRight className="h-4 w-4" />
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
