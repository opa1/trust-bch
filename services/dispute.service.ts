import { AppError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/utils/id";
import {
  Dispute,
  DisputeStatus,
  Escrow,
  EscrowStatus,
  DisputeEvidence,
  Prisma,
} from "@prisma/client";
import crypto from "crypto";
import { processEscrowRelease, processEscrowRefund } from "./escrow.service";
import { NotificationService } from "@/services/notification.service";
import { NotificationType } from "@prisma/client";

// Type definition for Dispute with relations
export type DisputeWithDetails = Dispute & {
  evidence?: DisputeEvidence[];
  escrow?: Escrow;
};

/**
 * Generates a human-readable dispute ID
 */
function generateDisputeId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString("hex");
  return `DIS-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Open a new dispute for an escrow
 *
 * @param escrowId - Escrow ID to dispute
 * @param userId - User raising the dispute
 * @param reason - Reason for dispute
 * @returns Created dispute
 */
export async function openDispute(
  escrowId: string,
  userId: string,
  reason: string,
): Promise<Dispute> {
  // Find escrow
  let escrow = await prisma.escrow.findUnique({
    where: { escrowId },
  });
  if (!escrow) {
    escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
  }

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND", { escrowId });
  }

  // Verify user is part of the escrow
  const isBuyer = escrow.buyerUserId === userId;
  const isSeller = escrow.sellerUserId === userId;

  if (!isBuyer && !isSeller) {
    throw new AppError("FORBIDDEN", {
      message: "Only escrow parties can raise disputes",
    });
  }

  // Check if escrow is in a disputable state
  // Check if escrow is in a disputable state
  if (
    escrow.status !== EscrowStatus.FUNDED &&
    escrow.status !== EscrowStatus.PENDING &&
    escrow.status !== EscrowStatus.IN_PROGRESS &&
    escrow.status !== EscrowStatus.SUBMITTED
  ) {
    throw new AppError("DISPUTE_CANNOT_BE_OPENED", {
      message: `Cannot dispute escrow in ${escrow.status} status. Only FUNDED, IN_PROGRESS, SUBMITTED or PENDING escrows can be disputed.`,
      currentState: escrow.status,
    });
  }

  // Check if dispute already exists
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      escrowId: escrow.id,
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });

  if (existingDispute) {
    throw new AppError("DISPUTE_ALREADY_EXISTS", { escrowId: escrow.id });
  }

  // Create dispute
  const disputeId = generateDisputeId();

  const dispute = await prisma.dispute.create({
    data: {
      id: generateId(),
      disputeId,
      escrowId: escrow.id,
      raisedBy: userId,
      reason,
      status: DisputeStatus.OPEN,
    },
  });

  // Transition escrow status to DISPUTED
  // We need to import transitionEscrow from escrow.service.ts
  // However, circular dependency might occur if escrow.service imports dispute.service.
  // dispute.service.ts DOES NOT import escrow.service usually?
  // Wait, I need to check imports.
  // If circular, we might need to use prisma directly or move transition logic.
  // Let's rely on import for now.

  // ... inside openDispute
  // ...
  await prisma.escrow.update({
    where: { id: escrow.id },
    data: { status: EscrowStatus.DISPUTED },
  });

  // Notify other party
  const otherPartyId =
    escrow.buyerUserId === userId ? escrow.sellerUserId : escrow.buyerUserId;

  await NotificationService.createNotification(
    otherPartyId,
    NotificationType.DISPUTE_OPENED,
    `A dispute has been opened for Escrow ${escrow.escrowId}.`,
    dispute.id,
  );

  return dispute;
}

/**
 * Add evidence to an existing dispute
 *
 * @param disputeId - Dispute ID
 * @param userId - User adding evidence
 * @param evidence - Evidence to add
 * @returns Updated dispute
 */
export async function addEvidence(
  disputeId: string,
  userId: string,
  evidence: { type: string; content: string }, // Simplified type since we don't need Mongoose types
): Promise<DisputeWithDetails> {
  // Find dispute
  let dispute = await prisma.dispute.findUnique({
    where: { disputeId },
    include: { escrow: true },
  });
  if (!dispute) {
    dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });
  }

  if (!dispute) {
    throw new AppError("DISPUTE_NOT_FOUND", { disputeId });
  }

  // Check if dispute is still open
  if (
    dispute.status !== DisputeStatus.OPEN &&
    dispute.status !== DisputeStatus.UNDER_REVIEW
  ) {
    throw new AppError("DISPUTE_RESOLVED", {
      message: "Cannot add evidence to a closed dispute",
      currentState: dispute.status,
    });
  }

  // Verify user is part of the escrow
  const escrow = dispute.escrow!; // We included it
  const isBuyer = escrow.buyerUserId === userId;
  const isSeller = escrow.sellerUserId === userId;

  if (!isBuyer && !isSeller) {
    throw new AppError("FORBIDDEN", {
      message: "Only escrow parties can add evidence",
    });
  }

  // Add evidence
  await prisma.disputeEvidence.create({
    data: {
      id: generateId(),
      disputeId: dispute.id,
      type: evidence.type,
      content: evidence.content,
      uploadedBy: userId,
      uploadedAt: new Date(),
    },
  });

  // Notify other party
  const otherPartyId =
    escrow.buyerUserId === userId ? escrow.sellerUserId : escrow.buyerUserId;

  await NotificationService.createNotification(
    otherPartyId,
    NotificationType.DISPUTE_MESSAGE,
    `New message in dispute for Escrow ${escrow.escrowId}.`,
    dispute.id,
  );

  // Return updated dispute with all evidence
  const updatedDispute = await prisma.dispute.findUnique({
    where: { id: dispute.id },
    include: { evidence: true, escrow: true },
  });

  return updatedDispute!;
}

/**
 * Get dispute status for an escrow
 *
 * @param escrowId - Escrow ID
 * @returns Dispute if found, null otherwise
 */
export async function getDisputeStatus(
  escrowId: string,
): Promise<Dispute | null> {
  // Find escrow
  let escrow = await prisma.escrow.findUnique({ where: { escrowId } });
  if (!escrow) {
    escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
  }

  if (!escrow) {
    return null;
  }

  // Find active dispute
  const dispute = await prisma.dispute.findFirst({
    where: {
      escrowId: escrow.id,
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });

  return dispute;
}

/**
 * Check if escrow has an active dispute
 *
 * @param escrowId - Escrow ID
 * @returns True if disputed, false otherwise
 */
export async function isEscrowDisputed(escrowId: string): Promise<boolean> {
  const dispute = await getDisputeStatus(escrowId);
  return dispute !== null;
}

/**
 * Resolve a dispute (admin only)
 *
 * @param disputeId - Dispute ID
 * @param adminId - Admin user ID
 * @param resolution - Resolution details
 * @param action - Action to take (release or refund)
 * @returns Resolved dispute
 */
export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolution: string,
  action: "release" | "refund",
): Promise<Dispute> {
  return await prisma.$transaction(
    async (tx) => {
      // Find dispute
      let dispute = await tx.dispute.findUnique({ where: { disputeId } });
      if (!dispute) {
        dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      }

      if (!dispute) {
        throw new AppError("DISPUTE_NOT_FOUND", { disputeId });
      }

      // Check if already resolved
      if (
        dispute.status === DisputeStatus.RESOLVED ||
        dispute.status === DisputeStatus.CLOSED
      ) {
        throw new AppError("DISPUTE_RESOLVED");
      }

      // Update dispute
      const updatedDispute = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // Execute funds movement
      if (action === "release") {
        await processEscrowRelease(dispute.escrowId, adminId, tx);
      } else if (action === "refund") {
        await processEscrowRefund(dispute.escrowId, adminId, tx);
      }

      return updatedDispute;
    },
    { timeout: 20000 },
  );
}

/**
 * Get all disputes for a user
 *
 * @param userId - User ID
 * @returns Array of disputes
 */
export async function getUserDisputes(
  userId: string,
): Promise<DisputeWithDetails[]> {
  const disputes = await prisma.dispute.findMany({
    where: {
      OR: [
        { raisedBy: userId },
        { escrow: { buyerUserId: userId } },
        { escrow: { sellerUserId: userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { escrow: true },
  });

  return disputes;
}

/**
 * Get dispute by ID
 *
 * @param disputeId - Dispute ID
 * @param userId - User ID (for authorization)
 * @returns Dispute details
 */
export async function getDisputeById(
  disputeId: string,
  userId: string,
): Promise<DisputeWithDetails> {
  let dispute = await prisma.dispute.findUnique({
    where: { disputeId },
    include: { escrow: true, evidence: true },
  });
  if (!dispute) {
    dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true, evidence: true },
    });
  }

  if (!dispute) {
    throw new AppError("DISPUTE_NOT_FOUND", { disputeId });
  }

  // Verify user is authorized to view
  const escrow = dispute.escrow!;
  const isBuyer = escrow.buyerUserId === userId;
  const isSeller = escrow.sellerUserId === userId;
  const isRaiser = dispute.raisedBy === userId;

  if (!isBuyer && !isSeller && !isRaiser) {
    throw new AppError("FORBIDDEN", {
      message: "Not authorized to view this dispute",
    });
  }

  return dispute;
}

/**
 * Concede a dispute (User gives up)
 *
 * @param disputeId - Dispute ID
 * @param userId - User ID conceding
 * @returns Resolved dispute
 */
export async function concedeDispute(
  disputeId: string,
  userId: string,
): Promise<Dispute> {
  return await prisma.$transaction(
    async (tx) => {
      // Find dispute
      let dispute = await tx.dispute.findUnique({
        where: { disputeId },
        include: { escrow: true },
      });
      if (!dispute) {
        dispute = await tx.dispute.findUnique({
          where: { id: disputeId },
          include: { escrow: true },
        });
      }

      if (!dispute) {
        throw new AppError("DISPUTE_NOT_FOUND", { disputeId });
      }

      // Check if open
      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.UNDER_REVIEW
      ) {
        throw new AppError("DISPUTE_RESOLVED", {
          message: "Cannot concede a closed dispute",
        });
      }

      const escrow = dispute.escrow!;
      const isBuyer = escrow.buyerUserId === userId;
      const isSeller = escrow.sellerUserId === userId;

      if (!isBuyer && !isSeller) {
        throw new AppError("FORBIDDEN", {
          message: "Only the buyer or seller can concede",
        });
      }

      // Determine action
      // If Buyer concedes -> Funds go to Seller (Release)
      // If Seller concedes -> Funds go to Buyer (Refund)
      const action = isBuyer ? "release" : "refund";
      const concederRole = isBuyer ? "Buyer" : "Seller";

      // Update dispute status first (to bypass lock in release/refund)
      const updatedDispute = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: `Conceded by ${concederRole}`,
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
      });

      console.log(
        `[Dispute] ${dispute.id} conceded by ${concederRole} (${userId}). Triggering ${action}.`,
      );

      // Execute funds movement
      if (action === "release") {
        await processEscrowRelease(dispute.escrowId, userId, tx);
      } else if (action === "refund") {
        await processEscrowRefund(dispute.escrowId, userId, tx);
      }

      // Notify other party
      const otherPartyId = isBuyer ? escrow.sellerUserId : escrow.buyerUserId;
      await NotificationService.createNotification(
        otherPartyId,
        NotificationType.DISPUTE_MESSAGE, // Or generic system message
        `The dispute for Escrow ${escrow.escrowId} has been resolved. The ${concederRole} conceded.`,
        dispute.id,
      );

      return updatedDispute;
    },
    { timeout: 20000 },
  );
}
