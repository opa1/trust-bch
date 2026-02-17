import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/utils/id";
import { NotificationService } from "@/services/notification.service";
import { NotificationType } from "@prisma/client";

interface AiVerificationResult {
  recommendation: "APPROVE" | "REJECT" | "NEEDS_REVIEW";
  reason: string;
  confidence: number;
  findings: {
    linkAccessible: boolean;
    contentType: string;
    fileSize?: string;
    apparentCompleteness: string;
    matchesDescription: boolean;
    concernsFound: string[];
    positiveSignals: string[];
  };
}

/**
 * Store AI verification result and notify buyer
 */
export async function recordAiVerification(
  escrowId: string,
  aiResult: AiVerificationResult,
): Promise<void> {
  console.log(`[AI Verification] Recording result for escrow ${escrowId}`);
  console.log(
    `[AI Verification] Recommendation: ${aiResult.recommendation} (${aiResult.confidence})`,
  );

  // Store verification in database
  await prisma.aiVerification.create({
    data: {
      id: generateId(),
      escrowId,
      recommendation: aiResult.recommendation,
      reason: aiResult.reason,
      confidence: aiResult.confidence,
      findings: aiResult.findings as any, // Cast specific JSON structure to any for Prisma Json type
      verifiedAt: new Date(),
    },
  });

  // Get escrow details
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    select: {
      escrowId: true,
      buyerUserId: true,
      sellerUserId: true,
      description: true,
    },
  });

  if (!escrow) {
    console.error(`[AI Verification] Escrow ${escrowId} not found`);
    return;
  }

  // Create notification message based on AI recommendation
  let buyerMessage: string;
  let sellerMessage: string;

  if (aiResult.recommendation === "APPROVE") {
    buyerMessage =
      `✅ Work submitted for Escrow ${escrow.escrowId}. ` +
      `AI recommends APPROVAL (${Math.round(aiResult.confidence * 100)}% confidence). ` +
      `Reason: ${aiResult.reason}. Please review and approve if satisfied.`;

    sellerMessage =
      `Your submission for Escrow ${escrow.escrowId} has been analyzed. ` +
      `AI recommends approval. Awaiting buyer's final decision.`;
  } else if (aiResult.recommendation === "REJECT") {
    buyerMessage =
      `⚠️ Work submitted for Escrow ${escrow.escrowId}. ` +
      `AI recommends REJECTION (${Math.round(aiResult.confidence * 100)}% confidence). ` +
      `Reason: ${aiResult.reason}. Please review carefully.`;

    sellerMessage =
      `Your submission for Escrow ${escrow.escrowId} has been analyzed. ` +
      `AI found concerns. Buyer will review and provide feedback.`;
  } else {
    buyerMessage =
      `📋 Work submitted for Escrow ${escrow.escrowId}. ` +
      `AI analysis inconclusive (${Math.round(aiResult.confidence * 100)}% confidence). ` +
      `Reason: ${aiResult.reason}. Your careful review is needed.`;

    sellerMessage =
      `Your submission for Escrow ${escrow.escrowId} is under review. ` +
      `Buyer will evaluate and respond soon.`;
  }

  // Notify buyer (primary decision maker)
  await NotificationService.createNotification(
    escrow.buyerUserId,
    NotificationType.WORK_SUBMITTED,
    buyerMessage,
    escrowId,
  );

  // Notify seller (informational)
  await NotificationService.createNotification(
    escrow.sellerUserId,
    NotificationType.WORK_SUBMITTED,
    sellerMessage,
    escrowId,
  );

  console.log(
    `[AI Verification] Notifications sent for escrow ${escrow.escrowId}`,
  );
}

/**
 * Get AI verification for an escrow
 */
export async function getAiVerification(escrowId: string) {
  return await prisma.aiVerification.findFirst({
    where: { escrowId },
    orderBy: { createdAt: "desc" },
  });
}
