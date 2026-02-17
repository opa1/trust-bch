"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

import {
  createDisputeSchema,
  type CreateDisputeFormData,
} from "@/lib/validations/dispute";

const formSchema = createDisputeSchema;

// Props could span a list of eligible escrows to select from
interface NewDisputeModalProps {
  eligibleEscrows?: { id: string; description: string }[];
  preselectedEscrowId?: string;
}

export function NewDisputeModal({
  eligibleEscrows = [],
  preselectedEscrowId,
}: NewDisputeModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateDisputeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      escrowId: preselectedEscrowId || "",
      reason: "",
      description: "",
    },
  });

  async function onSubmit(values: CreateDisputeFormData) {
    try {
      setIsLoading(true);
      await apiClient.createDispute(values.escrowId, {
        reason: values.reason,
        description: values.description,
      });
      setOpen(false);
      form.reset();
      toast.success("Dispute opened successfully");
      // Ideally trigger a refresh of the list here
    } catch (error) {
      console.error("Failed to create dispute:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Open New Dispute
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Open a Dispute</DialogTitle>
          <DialogDescription>
            Initiate a dispute for an existing transaction. An agent will be
            assigned to help.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="escrowId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escrow Transaction</FormLabel>
                  {/* If we have a list, use Select, otherwise Input for ID */}
                  {eligibleEscrows.length > 0 ? (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eligibleEscrows.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.description} ({e.id.substring(0, 8)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="Escrow ID" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Dispute</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="non_delivery">
                        Non-delivery of goods/service
                      </SelectItem>
                      <SelectItem value="item_mismatch">
                        Item not as described
                      </SelectItem>
                      <SelectItem value="unresponsive">
                        Counterparty unresponsive
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description & Evidence</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe the issue in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much context as possible for the agent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} variant="destructive">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Dispute
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
