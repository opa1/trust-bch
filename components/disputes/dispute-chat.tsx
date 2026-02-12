"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";

interface Evidence {
  id: string;
  type: string;
  content: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface DisputeChatProps {
  disputeId: string;
  initialEvidence: Evidence[];
  currentUserId: string;
}

export function DisputeChat({
  disputeId,
  initialEvidence,
  currentUserId,
}: DisputeChatProps) {
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const result = await apiClient.addDisputeEvidence(
        disputeId,
        newMessage,
        "text",
      );

      const updatedEvidence =
        result.data?.dispute?.evidence ||
        result.dispute?.evidence ||
        result.evidence;

      if (updatedEvidence) {
        setEvidence(updatedEvidence);
      }

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await apiClient.getDispute(disputeId);
        // Extract evidence from result (result.dispute or result)
        // apiClient.getDispute likely returns { success: true, data: { ... } } or data directly.
        // Let's assume result.dispute based on previous check.
        // But need to be careful about structure.

        // Let's check api-client.ts again?
        // Step 2064: getDispute returns response.data
        // response.data usually is { success: true, data: { ... } }

        const latestDispute = result.data?.dispute || result.dispute || result;
        if (latestDispute && latestDispute.evidence) {
          // Only update if length changed to avoid re-renders?
          // Or just set it. React handles equality if ref is same, but arrays are new refs.
          // We can check length.
          if (latestDispute.evidence.length !== evidence.length) {
            setEvidence(latestDispute.evidence);
            // Play sound here if we had one?
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [disputeId, evidence.length]);

  return (
    <div className="flex flex-col h-[400px] md:h-[500px] border rounded-md bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {evidence.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-10">
              <p>No messages yet. Start the conversation.</p>
            </div>
          ) : (
            evidence.map((ev) => {
              const isMe = ev.uploadedBy === currentUserId;
              return (
                <div
                  key={ev.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-all">
                      {ev.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {formatDistanceToNow(new Date(ev.uploadedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t bg-muted/20 flex gap-2">
        <div className="flex-1 min-w-0 relative">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message or paste evidence..."
            className="min-h-10 max-h-25 resize-none w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </div>
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
          className="h-10 w-10 shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
