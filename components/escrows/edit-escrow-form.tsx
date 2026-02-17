"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Check, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { apiClient } from "@/lib/api-client";
import {
  updateEscrowSchema,
  type UpdateEscrowFormData,
} from "@/lib/validations/escrow";

interface EditEscrowFormProps {
  escrow: {
    id: string;
    description: string;
    amountBCH: number;
    status: string;
  };
}

export function EditEscrowForm({ escrow }: EditEscrowFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only allow editing if status is CREATED or AWAITING_FUNDING
  // This should also be enforced by the parent page/API, but good to have UI check
  const isEditable = ["CREATED", "AWAITING_FUNDING"].includes(escrow.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateEscrowFormData>({
    resolver: zodResolver(updateEscrowSchema) as any,
    defaultValues: {
      description: escrow.description,
      amountBCH: escrow.amountBCH,
    },
  });

  const onSubmit = async (data: UpdateEscrowFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.updateEscrow(escrow.id, data);
      router.push(`/escrows/${escrow.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update escrow. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditable) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Cannot Edit Escrow</AlertTitle>
        <AlertDescription>
          This escrow is in <strong>{escrow.status}</strong> state and cannot be
          edited.
          <div className="mt-4">
            <Link href={`/escrows/${escrow.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/escrows/${escrow.id}`}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Escrow
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Edit Escrow
            </CardTitle>
            <CardDescription>
              Update the details of your escrow agreement.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-2">
                <Label htmlFor="amountBCH">Amount (BCH)</Label>
                <Input
                  id="amountBCH"
                  type="number"
                  step="0.00001"
                  min="0"
                  placeholder="0.00"
                  {...register("amountBCH")}
                  className={errors.amountBCH ? "border-red-500" : ""}
                  // If amount editing is restricted by policy later, disable this
                />
                {errors.amountBCH && (
                  <p className="text-sm text-red-500">
                    {errors.amountBCH.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Careful: Changing the amount will require generating a new
                  payment address if not yet funded.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link href={`/escrows/${escrow.id}`} className="w-full">
                  <Button variant="outline" className="w-full" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
