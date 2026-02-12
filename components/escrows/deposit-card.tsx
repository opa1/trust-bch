"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Clock, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface DepositCardProps {
  escrowAddress: string;
  amountBCH: number;
  expiresAt?: string | null;
  status: string;
}

export function DepositCard({
  escrowAddress,
  amountBCH,
  expiresAt,
  status,
}: DepositCardProps) {
  const [timeLeft, setTimeLeft] = React.useState<string>("");

  // Countdown timer
  React.useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Determine if address is testnet or mainnet based on prefix
  const isTestnet = escrowAddress.startsWith("bchtest:");
  const networkLabel = isTestnet ? "Testnet" : "Mainnet";

  // Strip bchtest: or bitcoincash: prefix for display
  const displayAddress = escrowAddress.replace(/^(bitcoincash|bchtest):/, "");

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(displayAddress);
    toast.success("Address copied to clipboard");
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amountBCH.toString());
    toast.success("Amount copied to clipboard");
  };

  const normalizedStatus = status?.toLowerCase() || "";
  const isAwaitingFunding =
    normalizedStatus === "awaiting_funding" ||
    normalizedStatus === "created" ||
    normalizedStatus === "pending";

  const isFunded =
    normalizedStatus === "funded" || normalizedStatus === "completed";

  const MINER_FEE_BUFFER = 0.00002;
  const totalAmount = amountBCH + MINER_FEE_BUFFER;
  // Format to avoid long floating point decimals
  const displayTotal = parseFloat(totalAmount.toFixed(8));

  const bchUri = `${escrowAddress}?amount=${displayTotal}`;

  if (isFunded) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <div className="rounded-full bg-green-500/10 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            Escrow Funded Successfully
          </p>
          <p className="text-xs text-muted-foreground">
            {displayTotal} BCH received
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isAwaitingFunding) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800/50 bg-linear-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-500" />
          Deposit BCH
        </CardTitle>
        <CardDescription>
          Send exactly <strong>{displayTotal} BCH</strong> to the address below
          <span className="block text-xs mt-1 text-muted-foreground">
            Includes {amountBCH} BCH (Deal) + {MINER_FEE_BUFFER} BCH (Network
            Fee)
          </span>
          <span className="block text-xs mt-1 text-muted-foreground">
            Network: {networkLabel}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <QRCodeSVG
              value={bchUri}
              size={180}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Amount (Deal + Fee)
          </label>
          <div
            className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(displayTotal.toString());
              toast.success("Amount copied to clipboard");
            }}
          >
            <span className="font-mono text-sm font-semibold">
              {displayTotal} BCH
            </span>
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Deposit Address
          </label>
          <div
            className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
            onClick={handleCopyAddress}
          >
            <span className="font-mono text-xs break-all flex-1 leading-relaxed">
              {displayAddress}
            </span>
            <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* Expiry countdown */}
        {expiresAt && timeLeft && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {timeLeft === "Expired"
                ? "Escrow expired"
                : `Expires in ${timeLeft}`}
            </span>
          </div>
        )}

        {/* Helper text */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Send the exact amount. The escrow will be funded automatically once
          the transaction is confirmed on the blockchain.
        </p>
      </CardContent>
    </Card>
  );
}
