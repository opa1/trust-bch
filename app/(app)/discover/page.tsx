"use client";

import { SellerCard } from "@/components/discover/seller-card";
import { Input } from "@/components/ui/input";
import { Plus, SearchAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  "All",
  "Development",
  "Design",
  "Writing",
  "Marketing",
  "Digital Services",
  "Other",
];

export default function DiscoverPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Find a Seller
          </h1>
          <p className="text-muted-foreground">
            Ranked by trust score — built from real on-chain history and AI
            verified deliveries.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push("/discover/listing")}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <Input
          placeholder="Search by service or seller name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
              ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <SearchAlert className="h-12 w-12 mx-auto mb-4 text-foreground/70" />
          <p className="text-foreground font-semibold text-lg">
            No sellers found
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Try a different category or search term
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            {listings.length} seller{listings.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <SellerCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
