"use client";

import { User as UserIcon, Mail, Calendar, Shield } from "lucide-react";
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
  if (!user) return null;

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
