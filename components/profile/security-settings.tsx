"use client";

import { LogOut, ShieldAlert, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function SecuritySettings() {
  const router = useRouter();
  const { logout } = useAuth(); // Assuming useAuth exposes this, or use apiClient directly

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      if (logout) logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your account security and session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base">Two-Factor Authentication</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account.
            </p>
          </div>
          <Switch disabled aria-label="Toggle 2FA" />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base">API Keys</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage API keys for external integrations.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Manage
          </Button>
        </div>

        <div className="pt-4">
          <Button
            variant="destructive"
            className="w-full sm:w-auto gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out of All Devices
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
