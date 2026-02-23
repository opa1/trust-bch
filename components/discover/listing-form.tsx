"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  "Development",
  "Design",
  "Writing",
  "Marketing",
  "Digital Services",
  "Other",
];

interface ListingFormProps {
  initialData?: {
    title: string;
    description: string;
    category: string;
    priceInBCH: number;
    deliveryDays: number;
  };
  isEditing?: boolean;
}

export function ListingForm({
  initialData,
  isEditing = false,
}: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    priceInBCH: initialData?.priceInBCH ? String(initialData.priceInBCH) : "",
    deliveryDays: initialData?.deliveryDays
      ? String(initialData.deliveryDays)
      : "",
  });

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.category ||
      !form.priceInBCH ||
      !form.deliveryDays
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/discover/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          priceInBCH: parseFloat(form.priceInBCH),
          deliveryDays: parseInt(form.deliveryDays),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save listing");
        return;
      }

      toast.success(isEditing ? "Listing updated" : "Listing created");
      router.push("/discover");
      router.refresh();
    } catch (error) {
      console.error("Failed to save listing:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/discover/listings", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete listing");
        return;
      }

      toast.success("Listing deleted");
      router.push("/discover");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete listing:", error);
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Service Details</CardTitle>
        {isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your seller listing. Buyers will
                  no longer be able to find you.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Listing"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            placeholder="e.g. I will build your Next.js landing page"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe what you offer, what's included, and what buyers can expect..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(val) => setForm({ ...form, category: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Price (BCH)</Label>
            <Input
              type="number"
              placeholder="0.05"
              min="0"
              step="0.001"
              value={form.priceInBCH}
              onChange={(e) => setForm({ ...form, priceInBCH: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Days</Label>
            <Input
              type="number"
              placeholder="3"
              min="1"
              value={form.deliveryDays}
              onChange={(e) =>
                setForm({ ...form, deliveryDays: e.target.value })
              }
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Listing"
              : "Save Listing"}
        </Button>
      </CardContent>
    </Card>
  );
}
