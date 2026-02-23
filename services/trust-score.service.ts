import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/utils/id";

/**
 * Recalculates and updates the trust score for a seller.
 * Called after every escrow completion (release, refund, or dispute).
 */
export async function updateTrustScore(sellerUserId: string): Promise<void> {
  console.log(`[TrustScore] Calculating score for seller ${sellerUserId}`);

  // Get seller's current reputation fields
  const user = await prisma.user.findUnique({
    where: { id: sellerUserId },
    select: {
      successRate: true,
      completedTasks: true,
      disputeRate: true,
      totalEscrows: true,
    },
  });

  if (!user) {
    console.error(`[TrustScore] User ${sellerUserId} not found`);
    return;
  }

  // Get all AI verifications for this seller's escrows
  const aiVerifications = await prisma.aiVerification.findMany({
    where: {
      escrow: { sellerUserId },
    },
    select: {
      recommendation: true,
      confidence: true,
    },
  });

  // Calculate average AI confidence across all APPROVE verdicts
  const approvals = aiVerifications.filter(
    (v) => v.recommendation === "APPROVE",
  );
  const avgAiConfidence =
    approvals.length > 0
      ? approvals.reduce((sum, v) => sum + v.confidence, 0) / approvals.length
      : 0;

  // Count disputed escrows for this seller
  const disputedCount = await prisma.escrow.count({
    where: {
      sellerUserId,
      status: { in: ["DISPUTED", "REFUNDED"] },
    },
  });

  // Count completed escrows for this seller
  const completedCount = await prisma.escrow.count({
    where: {
      sellerUserId,
      status: "RELEASED",
    },
  });

  const totalEscrows = completedCount + disputedCount;

  /**
   * Trust Score Formula (0 - 100):
   * - Success rate contributes 50% of the score
   * - Completed task volume contributes 30% (capped at 100 tasks)
   * - Dispute rate penalizes 20%
   * - AI approval confidence adds a bonus up to 10 points
   */
  const successWeight = (user.successRate / 100) * 50;
  const volumeWeight = Math.min(completedCount / 100, 1) * 30;
  const disputePenalty = (user.disputeRate / 100) * 20;
  const aiBonus = avgAiConfidence * 10;

  const rawScore = successWeight + volumeWeight - disputePenalty + aiBonus;

  // Clamp between 0 and 100
  const score = Math.max(0, Math.min(100, rawScore));

  console.log(`[TrustScore] Seller ${sellerUserId} score breakdown:`);
  console.log(`  Success weight: ${successWeight.toFixed(2)}`);
  console.log(`  Volume weight:  ${volumeWeight.toFixed(2)}`);
  console.log(`  Dispute penalty: -${disputePenalty.toFixed(2)}`);
  console.log(`  AI bonus:       +${aiBonus.toFixed(2)}`);
  console.log(`  Final score:    ${score.toFixed(2)}`);

  // Upsert trust score record
  const existing = await prisma.sellerTrustScore.findUnique({
    where: { userId: sellerUserId },
  });

  if (existing) {
    await prisma.sellerTrustScore.update({
      where: { userId: sellerUserId },
      data: {
        score,
        totalEscrows,
        completedCount,
        disputedCount,
        avgAiConfidence,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.sellerTrustScore.create({
      data: {
        id: generateId(),
        userId: sellerUserId,
        score: Number(score),
        totalEscrows: Number(totalEscrows),
        completedCount: Number(completedCount),
        disputedCount: Number(disputedCount),
        avgAiConfidence: Number(avgAiConfidence),
        lastCalculated: new Date(),
      },
    });
  }

  console.log(
    `[TrustScore] Score updated for seller ${sellerUserId}: ${score.toFixed(2)}`,
  );
}
