"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ListingForm } from "@/components/discover/listing-form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ListingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fetching, setFetching] = useState(true);
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch("/api/discover/listings");
        const data = await res.json();
        if (data.listing) {
          // If listing exists, redirect to edit or show management
          // The user specifically asked for a form for Creating and Editing.
          // I will redirect to edit if it exists, or show the create form here.
          router.replace("/discover/listing/edit");
        } else {
          setFetching(false);
        }
      } catch (error) {
        console.error("Failed to fetch listing:", error);
        setFetching(false);
      }
    };

    if (user) {
      fetchListing();
    } else if (!authLoading) {
      setFetching(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || fetching) {
    return (
      <div className="flex h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Create Your Listing
        </h1>
        <p className="text-muted-foreground text-sm">
          This is how buyers will find you on Discovery. Keep it clear and
          specific.
        </p>
      </div>

      <ListingForm isEditing={false} />
    </div>
  );
}
