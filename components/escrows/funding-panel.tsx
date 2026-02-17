"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { DepositCard } from "./deposit-card";
import { Escrow } from "@prisma/client";
import { User } from "@/lib/store/auth.store";

interface FundingPanelProps {
  escrow: Escrow & { escrowAddress: string };
  user?: User | null;
  onFunded: () => void;
}

export function FundingPanel({ escrow, user, onFunded }: FundingPanelProps) {
  const [balance, setBalance] = useState<{
    balance: number;
    confirmed: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getWalletBalance();
      // data: { success: true, data: { address, balance, confirmed, unconfirmed } }
      // Wait, response from route is successResponse({ ... })
      // So data structure depends on interceptor or helper.
      // apiClient.getWalletBalance returns response.data.
      // successResponse returns { success: true, data: ... }
      // So result is data.data.

      const balanceData = data.data || data; // Handle both structures if interceptor flattens
      setBalance(balanceData);
    } catch (err) {
      console.error("Failed to fetch balance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();

    // Poll every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFund = async () => {
    setFunding(true);
    try {
      await apiClient.fundEscrow(escrow.id);
      onFunded();
    } catch (err) {
      console.error(err);
      // Error handled by apiClient
    } finally {
      setFunding(false);
    }
  };

  const requiredAmount = escrow.amountBCH;
  // const feeBuffer = 0.00001; // Managed by backend

  // If we have balance, check if sufficient
  const hasSufficientBalance = balance && balance.confirmed >= requiredAmount;
  // Note: Backend might use total balance for checks, but UI should be conservative or match backend.
  // Backend checks confirmed balance primarily.

  // Also showing the Deposit Card if insufficient OR if loading failed (user might not have wallet set up?)
  // But user IS set up if they are viewing this (auth check).

  // If User Wallet Address is same as Escrow Address (should never happen in new system), then logic differs.
  // Secure setup: User Wallet != Escrow Wallet.

  if (!user?.walletAddress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">
            Error: Your account does not have a wallet assigned.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            <span>Your Wallet Balance</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBalance}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </CardTitle>
          <CardDescription>
            Funds must be in your permanent wallet to fund escrows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-1 justify-between items-baseline">
              <span className="text-muted-foreground">Confirmed Balance:</span>
              <span className="text-2xl font-bold font-mono">
                {balance !== null ? balance.confirmed?.toFixed(8) : "---"} BCH
              </span>
            </div>
            {/* 
                 <div className="flex justify-between items-baseline text-sm text-muted-foreground">
                     <span>Unconfirmed:</span>
                     <span className="font-mono">{balance?.unconfirmed?.toFixed(8) || 0} BCH</span>
                 </div>
                 */}
            {hasSufficientBalance ? (
              <div className="mt-4">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                  onClick={handleFund}
                  disabled={funding}
                >
                  {funding ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Fund Escrow ({requiredAmount} BCH)
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  Network fees will be deducted from your wallet.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md text-sm text-center">
                Insufficient funds. Please deposit to your wallet below.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!hasSufficientBalance && (
        <DepositCard
          escrowAddress={user.walletAddress} // Show USER wallet, not escrow wallet
          amountBCH={escrow.amountBCH}
          expiresAt={escrow.expiresAt?.toString()} // Convert date to string if needed by DepositCard
          status="awaiting_funding" // Force display
        />
      )}
    </div>
  );
}
