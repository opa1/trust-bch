"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  User as UserIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

interface SellerSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSelectUser?: (user: Partial<User>) => void;
}

export function SellerSearchInput({
  className,
  onSelectUser,
  onChange,
  ...props
}: SellerSearchInputProps) {
  const [query, setQuery] = useState((props.value as string) || "");
  const [results, setResults] = useState<Partial<User>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal state with prop value if it changes externally
  useEffect(() => {
    if (props.value !== undefined) {
      setQuery(props.value as string);
      // If props.value is cleared externally, clear selection
      if (props.value === "" && selectedUser) {
        setSelectedUser(null);
      }
    }
  }, [props.value, selectedUser]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      // If query matches selected value exactly, don't search
      if (selectedUser && query === selectedUser.email) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await apiClient.searchUsers(query);
        const filteredUsers = (data.users || []).filter(
          (u: Partial<User>) => u.email !== currentUser?.email,
        );
        setResults(filteredUsers);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, selectedUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // If user types, clear selection to switch back to search mode
    if (selectedUser) {
      setSelectedUser(null);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleSelect = (user: Partial<User>) => {
    if (user.email) {
      setQuery(user.email);
      setSelectedUser(user);

      // Create a synthetic event to trigger form update
      const event = {
        target: { value: user.email, name: props.name },
      } as React.ChangeEvent<HTMLInputElement>;

      if (onChange) onChange(event);
      if (onSelectUser) onSelectUser(user);
    }
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setQuery("");

    // Trigger change with empty value
    const event = {
      target: { value: "", name: props.name },
    } as React.ChangeEvent<HTMLInputElement>;

    if (onChange) onChange(event);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {selectedUser ? (
        <div className="flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {selectedUser.fullName}
                </p>
                {selectedUser.successRate !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    {selectedUser.successRate}%
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {selectedUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="ml-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
          >
            <span className="sr-only">Clear selection</span>
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            {...props}
            className={cn("pr-10", className)}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length >= 2 && results.length > 0) setShowResults(true);
            }}
            autoComplete="off"
          />
          <div className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5 opacity-50" />
            )}
          </div>
        </div>
      )}

      {/* Hidden input to maintain form registration when tile is shown */}
      {selectedUser && (
        <Input {...props} className="hidden" value={query} readOnly />
      )}

      {showResults && results.length > 0 && !selectedUser && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {results.map((user) => (
              <li
                key={user.id}
                onClick={() => handleSelect(user)}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="w-full flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                    <UserIcon className="h-4 w-4" />
                  </div>

                  <div className="w-full">
                    <div className="flex items-center justify-between whitespace-nowrap">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {user.fullName}
                      </p>
                      {user.successRate !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          {user.successRate}% Success
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults &&
        !isLoading &&
        query.length >= 2 &&
        results.length === 0 &&
        !selectedUser && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg p-3 text-center text-sm text-slate-500">
            No users found matching "{query}"
          </div>
        )}
    </div>
  );
}
