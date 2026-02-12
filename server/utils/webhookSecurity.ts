import "server-only";
import crypto from "crypto";

/**
 * Verify HMAC-SHA256 webhook signature
 *
 * @param payload - Raw payload string
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret key
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    // Compute expected signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch (error) {
    // If comparison fails (e.g., length mismatch), return false
    return false;
  }
}

/**
 * Validate webhook timestamp
 *
 * @param timestamp - Unix timestamp from webhook
 * @param maxAgeSeconds - Maximum age in seconds (default: 300 = 5 minutes)
 * @returns True if timestamp is valid and recent
 */
export function validateTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 300,
): boolean {
  if (!timestamp || typeof timestamp !== "number") {
    return false;
  }

  const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
  const age = now - timestamp;

  // Check if timestamp is within acceptable window
  // Also reject future timestamps (could be clock drift)
  return age >= 0 && age <= maxAgeSeconds;
}

/**
 * Generate deterministic event ID from webhook payload
 *
 * @param payload - Webhook payload object
 * @returns Unique event ID
 */
export function generateEventId(payload: {
  address: string;
  txHash: string;
  timestamp?: number;
}): string {
  // Create deterministic ID from key fields
  const data = `${payload.address}:${payload.txHash}:${payload.timestamp || ""}`;

  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify all webhook security checks
 *
 * @param rawPayload - Raw payload string
 * @param signature - Signature from header
 * @param secret - Webhook secret
 * @param timestamp - Timestamp from payload
 * @returns Object with validation results
 */
export function verifyWebhook(
  rawPayload: string,
  signature: string | null,
  secret: string,
  timestamp: number,
): {
  valid: boolean;
  error?: string;
} {
  // Check signature
  if (!signature) {
    return { valid: false, error: "Missing signature" };
  }

  if (!verifyWebhookSignature(rawPayload, signature, secret)) {
    return { valid: false, error: "Invalid signature" };
  }

  // Check timestamp
  if (!validateTimestamp(timestamp)) {
    return { valid: false, error: "Expired or invalid timestamp" };
  }

  return { valid: true };
}
