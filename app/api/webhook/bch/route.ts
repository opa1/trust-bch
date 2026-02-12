import { config } from "@/config";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { generateEventId, verifyWebhook } from "@/server/utils/webhookSecurity";
import { handleBchWebhook } from "@/services/escrow.service";
import {
  checkDuplicateEvent,
  recordWebhookEvent,
} from "@/services/webhookEvent.service";
import { NextRequest } from "next/server";

/**
 * POST /api/webhook/bch
 * Handle incoming Bitcoin Cash transaction notifications
 *
 * Security:
 * - HMAC signature verification
 * - Timestamp validation (5-minute window)
 * - Idempotency protection
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Extract payload fields
    const { address, txHash, amountBCH, confirmations, timestamp } = body;

    // Basic validation
    if (!address || !txHash || amountBCH === undefined) {
      return errorResponse("Invalid webhook payload", 400, "VALIDATION_ERROR");
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] WEBHOOK_SECRET not configured");
      return errorResponse("Webhook not configured", 500, "CONFIG_ERROR");
    }

    // 1. Verify signature and timestamp
    const signature = req.headers.get("x-webhook-signature");
    const verification = verifyWebhook(
      rawBody,
      signature,
      webhookSecret,
      timestamp,
    );

    if (!verification.valid) {
      console.warn(`[Webhook] Security check failed: ${verification.error}`);
      return errorResponse(
        verification.error || "Unauthorized",
        401,
        "UNAUTHORIZED",
      );
    }

    // 2. Check for duplicate events (idempotency)
    const eventId = generateEventId({ address, txHash, timestamp });
    const isDuplicate = await checkDuplicateEvent(eventId);

    if (isDuplicate) {
      console.log(`[Webhook] Duplicate event detected: ${eventId}`);
      return successResponse({
        message: "Event already processed",
        eventId,
      });
    }

    // 3. Record event before processing
    await recordWebhookEvent(eventId, body);

    // 4. Get minimum confirmations from config
    const minConfirmations = config.escrow.minConfirmations;

    // 5. Handle webhook via service
    const result = await handleBchWebhook(
      address,
      txHash,
      amountBCH,
      confirmations || 0,
      minConfirmations,
    );

    // Return appropriate response
    if (!result.tracked) {
      return successResponse({
        message: result.message,
        eventId,
      });
    }

    return successResponse({
      message: result.message,
      escrowId: result.escrowId,
      status: result.status,
      confirmations: result.confirmations,
      eventId,
    });
  } catch (error) {
    return handleError(error);
  }
}
