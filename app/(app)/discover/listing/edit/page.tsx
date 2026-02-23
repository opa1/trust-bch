"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ListingForm } from "@/components/discover/listing-form";
import { Loader2 } from "lucide-react";

export default function EditListingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [fetching, setFetching] = useState(true);
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch("/api/discover/listings");
        const data = await res.json();
        if (data.listing) {
          setListing(data.listing);
        }
      } catch (error) {
        console.error("Failed to fetch listing:", error);
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      fetchListing();
    } else if (!authLoading) {
      setFetching(false);
    }
  }, [user, authLoading]);

  if (authLoading || fetching) {
    return (
      <div className="flex h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-100 items-center justify-center">
        <p className="text-muted-foreground text-sm italic">
          Please sign in to edit your listing.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Edit Your Listing
        </h1>
        <p className="text-muted-foreground text-sm">
          Update your service details to stay competitive and clear for buyers.
        </p>
      </div>

      <ListingForm initialData={listing} isEditing={true} />
    </div>
  );
}
