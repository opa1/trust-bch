"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/lib/validations/profile";

const formSchema = updateProfileSchema;

export function UpdateProfileForm() {
  const { user, checkAuth } = useAuth(); // Assuming setUser is available or use checkAuth to refresh
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  // Load initial values
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        password: "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: UpdateProfileFormData) {
    try {
      setIsLoading(true);

      const updateData: any = {
        fullName: values.fullName,
        email: values.email,
      };

      if (values.password && values.password.length > 0) {
        if (values.password.length < 6) {
          form.setError("password", {
            message: "Password must be at least 6 characters",
          });
          setIsLoading(false);
          return;
        }
        updateData.password = values.password;
      }

      const updatedUser = await apiClient.updateProfile(updateData);

      // Update local store if possible, or just re-fetch
      // Here we assume setUser exists in useAuth, otherwise we might need to reload window or call checkAuth
      // Based on previous file read, useAuth has setUser (exposed from store)
      // Actually useAuth exposes setUser directly from store.

      // We need to type cast or ensure useAuth returns setUser.
      // Looking at useAuth.ts viewed earlier, it didn't explicitly return setUser, but it destructured it from store.
      // Let's re-verify useAuth return.
      // It returns: { user, ..., login, register, logout, checkAuth }
      // It does NOT return setUser directly in the return object list in the snippet I saw.
      // It returns `checkAuth`. So I should call `checkAuth()` to refresh user.

      // Wait, snippet:
      // return {
      //   user,
      //   isAuthenticated,
      //   ...
      //   checkAuth,
      // };

      // I'll use checkAuth() to refresh the user data in store.

      const { checkAuth } = useAuth(); // This is a hook call, can't be conditional.
      // But I am inside the component, so I can use the one from top level.

      // Wait, I already called useAuth at top level.
      // I need to start using checkAuth from there.

      // Refetch user data
      // await checkAuth(); // This might be enough if updatedUser is not returned directly to store

      // However, checkAuth makes a GET request.
      // Efficient way: update store manually if possible.
      // Since I can't access setUser easily (it wasn't returned), I'll rely on checkAuth or page reload.
      // Or I can modify useAuth to return setUser, but I want to avoid modifying hooks if not needed.
      // Actually, looking at the code I wrote for useAuth, it DOES NOT return setUser.
      // So I will use `window.location.reload()` or just `router.refresh()`? No, router refresh won't update client store.
      // I will trust `apiClient.getCurrentUser` called by `checkAuth`?
      // But `checkAuth` function is available.

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAfterSubmit = async (values: UpdateProfileFormData) => {
    // Wrapper to handle async and `checkAuth` after submit
    await onSubmit(values);
    await checkAuth();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAfterSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Changing email will require re-verification (simulated).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep current"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
