"use client";

import { ProfileCard } from "@/components/profile/profile-card";
import { UpdateProfileForm } from "@/components/profile/update-profile-form";
import { SecuritySettings } from "@/components/profile/security-settings";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account details and security preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileCard user={user} />
          <SecuritySettings />
        </div>
        <div className="space-y-6">
          <UpdateProfileForm />
        </div>
      </div>
    </div>
  );
}
