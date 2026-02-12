"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Info, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiClient } from "@/lib/api-client";
import {
  createEscrowSchema,
  type CreateEscrowFormData,
} from "@/lib/validations/escrow";
import { useEscrowStore } from "@/lib/store/escrow.store";

export function CreateEscrowForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { invalidateEscrows } = useEscrowStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      description: "",
      amountBCH: 0,
      sellerEmail: "",
    },
  });

  const onSubmit = async (data: CreateEscrowFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.createEscrow(data);

      // Invalidate the escrow store to force a refresh
      invalidateEscrows();

      // Redirect to the new escrow detail page if result contains id, otherwise list
      // Assuming result structure matches what we expect or just list
      if (result && result.escrowId) {
        router.push(`/escrows/${result.escrowId}`);
      } else if (result && result.id) {
        router.push(`/escrows/${result.id}`);
      } else {
        router.push("/escrows");
      }
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create escrow. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-none!">
          <CardHeader className="px-5 md:px-8">
            <CardTitle className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Create New Escrow
            </CardTitle>
            <CardDescription>
              Start a secure transaction by defining the terms and amount.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 md:px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description of Product/Service
                </Label>
                <Input
                  id="description"
                  placeholder="e.g. Web Development Services - Milestone 1"
                  {...register("description")}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amountBCH">Amount (BCH)</Label>
                  <Input
                    id="amountBCH"
                    type="number"
                    step="0.00001"
                    min="0"
                    placeholder="0.00"
                    {...register("amountBCH", { valueAsNumber: true })}
                    className={errors.amountBCH ? "border-red-500" : ""}
                  />
                  {errors.amountBCH && (
                    <p className="text-sm text-red-500">
                      {errors.amountBCH.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Seller's Email</Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    placeholder="seller@example.com"
                    {...register("sellerEmail")}
                    className={errors.sellerEmail ? "border-red-500" : ""}
                  />
                  {errors.sellerEmail && (
                    <p className="text-sm text-red-500">
                      {errors.sellerEmail.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The seller must be registered with this email.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Info className="h-4 w-4" />
                  How it works
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                  <li>Seller will be notified via email.</li>
                  <li>
                    You will receive a unique BCH address to fund the escrow.
                  </li>
                  <li>
                    Funds are held securely until you verify the delivery.
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg transition-all duration-300 hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Escrow...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Escrow
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
