import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusMap: Record<
    string,
    {
      variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning";
      label: string;
    }
  > = {
    created: { variant: "secondary", label: "Created" },
    awaiting_funding: { variant: "warning", label: "Awaiting Deposit" },
    pending: { variant: "warning", label: "Pending" },
    funded: { variant: "default", label: "Funded" },
    released: { variant: "success", label: "Released" },
    refunded: { variant: "warning", label: "Refunded" },
    disputed: { variant: "destructive", label: "Disputed" },
    completed: { variant: "success", label: "Completed" },
    expired: { variant: "outline", label: "Expired" },
  };

  const config = statusMap[status.toLowerCase()] || {
    variant: "outline",
    label: status,
  };

  // Map custom variants to valid Badge variants if needed, or assume Badge supports them
  // If Badge doesn't support success/warning, fallback to outline/secondary
  // ensuring type safety
  const validVariant = (
    ["default", "secondary", "destructive", "outline"].includes(config.variant)
      ? config.variant
      : "outline"
  ) as "default" | "secondary" | "destructive" | "outline";

  // Custom styling for non-standard variants
  const className =
    {
      default: "",
      secondary: "",
      destructive: "",
      outline: "",
      success:
        "bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-transparent",
      warning:
        "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25 border-transparent",
    }[config.variant] || "";

  return (
    <Badge variant={validVariant} className={className}>
      {config.label}
    </Badge>
  );
}
