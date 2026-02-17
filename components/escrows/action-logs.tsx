import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ActionLogsProps {
  logs: any[]; // Define proper type if available
}

export function ActionLogs({ logs = [] }: ActionLogsProps) {
  // If no logs array exists (e.g. not implemented in API yet), we show default/empty
  // Ideally this would be populated from a separate /events endpoint or included in escrow object

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-4 relative pl-4 border-l">
            {logs.map((log, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                <p className="text-sm font-medium break-all">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
