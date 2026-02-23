"use client";

import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { User } from "@/lib/store/auth.store";

interface ProfileCardProps {
  user: User | null;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={`https://avatar.vercel.sh/${user.email}`}
            alt={user.fullName}
          />
          <AvatarFallback className="text-lg">
            {user.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{user.fullName}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">User ID</span>
          </div>
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
            {user.id}
          </code>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              Member Since
            </span>
          </div>
          <span className="text-sm">
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-3 shadow-sm bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-medium">BCH Wallet Address</span>
            </div>
            {user.walletAddress && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyAddress}
                title={copied ? "Copied!" : "Copy address"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <div className="mt-1">
            {user.walletAddress ? (
              <code className="block break-all rounded bg-muted-foreground/10 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-foreground sm:text-xs">
                {user.walletAddress}
              </code>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No wallet address generated
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              Account Status
            </span>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 text-xs"
          >
            Active Verified
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
