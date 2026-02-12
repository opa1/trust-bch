import "server-only";
import { prisma } from "@/lib/db/prisma";
import { WebhookEvent } from "@prisma/client";
import { generateId } from "@/lib/utils/id";

/**
 * Check if webhook event has already been processed
 *
 * @param eventId - Event ID to check
 * @returns True if event is duplicate
 */
export async function checkDuplicateEvent(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  return existing !== null;
}

/**
 * Record webhook event for idempotency
 *
 * @param eventId - Unique event ID
 * @param payload - Webhook payload
 * @returns Created webhook event
 */
export async function recordWebhookEvent(
  eventId: string,
  payload: {
    address: string;
    txHash: string;
    [key: string]: any;
  },
): Promise<WebhookEvent> {
  const event = await prisma.webhookEvent.create({
    data: {
      id: generateId(),
      eventId,
      txHash: payload.txHash,
      address: payload.address,
      processedAt: new Date(),
      payload,
    },
  });

  return event;
}

/**
 * Get webhook event by ID
 *
 * @param eventId - Event ID
 * @returns Webhook event or null
 */
export async function getWebhookEvent(
  eventId: string,
): Promise<WebhookEvent | null> {
  return await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
}

/**
 * Clean up old webhook events (optional maintenance)
 *
 * @param daysOld - Delete events older than this many days
 * @returns Number of deleted events
 */
export async function cleanupOldEvents(daysOld: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await prisma.webhookEvent.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}
