import { config } from "@/config";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/AppError";
import { generateId } from "@/lib/utils/id";
import {
  DisputeStatus,
  Escrow,
  EscrowStatus,
  Prisma,
  Transaction,
  TransactionDirection,
  User,
} from "@prisma/client";

import {
  broadcastTransaction,
  createTransaction,
  getAddressBalance,
  getAddressTransactions,
} from "@/server/blockchain/bch";
import {
  decryptPrivateKey,
  generateEncryptedWallet,
} from "@/server/blockchain/wallet";

import { submitTaskWithRetry } from "@/services/agent.service";
import { getUserByEmail } from "@/services/auth.service";
import { updateUserReputation } from "@/services/reputation.service";

import { NotificationService } from "@/services/notification.service";
import { NotificationType } from "@prisma/client";

import { updateTrustScore } from "@/services/trust-score.service";

/**
 * Allowed state transitions map
 * Defines the strict state machine rules
 */
const ALLOWED_TRANSITIONS: Map<EscrowStatus, EscrowStatus[]> = new Map([
  // CREATED -> AWAITING_FUNDING
  [EscrowStatus.CREATED, [EscrowStatus.AWAITING_FUNDING]],

  // AWAITING_FUNDING -> FUNDING_IN_PROGRESS | CANCELLED | EXPIRED
  [
    EscrowStatus.AWAITING_FUNDING,
    [
      EscrowStatus.FUNDING_IN_PROGRESS,
      EscrowStatus.CANCELLED,
      EscrowStatus.EXPIRED,
    ],
  ],

  // FUNDING_IN_PROGRESS -> FUNDED | AWAITING_FUNDING (retry)
  [
    EscrowStatus.FUNDING_IN_PROGRESS,
    [EscrowStatus.FUNDED, EscrowStatus.AWAITING_FUNDING],
  ],

  // FUNDED -> IN_PROGRESS | DISPUTED
  [EscrowStatus.FUNDED, [EscrowStatus.IN_PROGRESS, EscrowStatus.DISPUTED]],

  // IN_PROGRESS -> SUBMITTED | EXPIRED | DISPUTED
  [
    EscrowStatus.IN_PROGRESS,
    [EscrowStatus.SUBMITTED, EscrowStatus.EXPIRED, EscrowStatus.DISPUTED],
  ],

  // SUBMITTED -> VERIFIED | DISPUTED
  [EscrowStatus.SUBMITTED, [EscrowStatus.VERIFIED, EscrowStatus.DISPUTED]],

  // VERIFIED -> RELEASED
  [EscrowStatus.VERIFIED, [EscrowStatus.RELEASED]],

  // DISPUTED -> REFUNDED | RELEASED (admin resolution)
  [EscrowStatus.DISPUTED, [EscrowStatus.REFUNDED, EscrowStatus.RELEASED]],

  // Legacy PENDING maps to AWAITING_FUNDING transitions + DISPUTED
  [
    EscrowStatus.PENDING,
    [
      EscrowStatus.FUNDED,
      EscrowStatus.CANCELLED,
      EscrowStatus.EXPIRED,
      EscrowStatus.DISPUTED,
    ],
  ],
]);

/**
 * Generates a human-readable escrow ID
 */
function generateEscrowId(): string {
  // Use nanoid with custom alphabet or just shorten standard one
  // User requested NanoID for all IDs
  const id = generateId();
  return `ESC-${id}`.toUpperCase();
}

/**
 * Check if a state transition is allowed
 */
function isTransitionAllowed(
  fromState: EscrowStatus,
  toState: EscrowStatus,
): boolean {
  const allowedNextStates = ALLOWED_TRANSITIONS.get(fromState);
  return allowedNextStates?.includes(toState) ?? false;
}

/**
 * Get timestamp field name for state
 */
function getTimestampField(state: EscrowStatus): string | null {
  const timestampMap: Record<string, string> = {
    [EscrowStatus.FUNDED]: "fundedAt",
    [EscrowStatus.SUBMITTED]: "submittedAt",
    [EscrowStatus.VERIFIED]: "verifiedAt",
    [EscrowStatus.RELEASED]: "releasedAt",
    [EscrowStatus.DISPUTED]: "disputeOpenedAt",
    [EscrowStatus.REFUNDED]: "completedAt",
    [EscrowStatus.CANCELLED]: "completedAt",
    [EscrowStatus.EXPIRED]: "completedAt",
  };
  return timestampMap[state] || null;
}

/**
 * Log state transition for audit trail
 */
/**
 * Log state transition for audit trail
 */
async function logStateTransition(
  escrowId: string,
  fromState: EscrowStatus,
  toState: EscrowStatus,
  triggeredBy?: string,
  metadata?: Record<string, any>,
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  try {
    await tx.stateTransition.create({
      data: {
        id: generateId(),
        escrowId,
        fromState,
        toState,
        triggeredBy: triggeredBy || null,
        metadata: metadata || undefined,
        timestamp: new Date(),
      },
    });

    console.log(
      `[State Machine] ${escrowId}: ${fromState} → ${toState}` +
        (triggeredBy ? ` (by ${triggeredBy})` : ""),
    );
  } catch (error) {
    console.error(
      `[State Machine] Failed to log transition for ${escrowId}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    // In a transaction, rethrow to abort
    if (tx !== prisma) throw error;
  }
}

/**
 * Trigger side effects for FUNDED state
 */

// ... inside triggerFundedSideEffects
async function triggerFundedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - FUNDED] Notifying agent for escrow ${escrow.escrowId}`,
    );

    // Notify Seller
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.ESCROW_FUNDED,
      `Escrow ${escrow.escrowId} has been funded! You can now start working.`,
      escrow.id,
    );

    // Notify agent about funding completion
    await submitTaskWithRetry(
      "escrow_funded",
      {
        escrowId: escrow.escrowId,
        amountBCH: escrow.amountBCH,
        fundedAt: escrow.fundedAt,
      },
      escrow.id,
      2, // Max 2 retries
    ).catch((error) => {
      console.error("[Side Effect - FUNDED] Agent notification failed:", error);
    });
  } catch (error) {
    console.error("[Side Effect - FUNDED] Error:", error);
  }
}

/**
 * Trigger side effects for SUBMITTED state
 */
async function triggerSubmittedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - SUBMITTED] Calling verification service for escrow ${escrow.escrowId}`,
    );

    // Notify Buyer
    await NotificationService.createNotification(
      escrow.buyerUserId,
      NotificationType.WORK_SUBMITTED,
      `Work has been submitted for Escrow ${escrow.escrowId}. Please review it.`,
      escrow.id,
    );

    // Call verification service with actual submission content
    // Use submissionContent if available, otherwise fall back to description (legacy behavior)
    const verificationContent = escrow.submissionContent || escrow.description;

    await submitTaskWithRetry(
      "verify_task_submission",
      {
        escrowId: escrow.escrowId,
        submittedAt: escrow.submittedAt,
        description: escrow.description, // Keep original description for context
        submissionContent: verificationContent, // Add actual work content
      },
      escrow.id,
      2,
    ).catch((error) => {
      console.error(
        "[Side Effect - SUBMITTED] Verification call failed:",
        error,
      );
    });
  } catch (error) {
    console.error("[Side Effect - SUBMITTED] Error:", error);
  }
}

/**
 * Buyer approves submitted work
 * Status transition: SUBMITTED → VERIFIED
 * Authorization: Buyer only
 */
export async function buyerApproveWork(
  escrowId: string,
  buyerId: string,
): Promise<Escrow> {
  return await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findFirst({
      where: { OR: [{ escrowId }, { id: escrowId }] },
    });

    if (!escrow) {
      throw new AppError("ESCROW_NOT_FOUND");
    }

    if (escrow.buyerUserId !== buyerId) {
      throw new AppError("FORBIDDEN", {
        message: "Only the buyer can approve work",
      });
    }

    if (escrow.status !== EscrowStatus.SUBMITTED) {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Can only approve work when SUBMITTED",
        currentStatus: escrow.status,
      });
    }

    // Get AI recommendation (if exists)
    const aiVerification = await tx.aiVerification.findFirst({
      where: { escrowId: escrow.id },
      orderBy: { createdAt: "desc" },
    });

    // Transition to VERIFIED
    const verified = await transitionEscrow(
      escrow.id,
      EscrowStatus.VERIFIED,
      buyerId,
      {
        method: "buyerApproveWork",
        approvedAt: new Date(),
        aiRecommendation: aiVerification?.recommendation || "none",
        aiConfidence: aiVerification?.confidence || 0,
      },
      tx,
    );

    // Notify seller
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.WORK_VERIFIED,
      `✅ Your work for Escrow ${escrow.escrowId} has been approved! Funds will be released shortly.`,
      escrow.id,
    );

    return verified;
  });
}

/**
 * Buyer requests revision or disputes work
 * Status transition: SUBMITTED → IN_PROGRESS (for revision) or SUBMITTED → DISPUTED
 */
export async function buyerRequestRevision(
  escrowId: string,
  buyerId: string,
  feedback: string,
): Promise<Escrow> {
  return await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findFirst({
      where: { OR: [{ escrowId }, { id: escrowId }] },
    });

    if (!escrow) {
      throw new AppError("ESCROW_NOT_FOUND");
    }

    if (escrow.buyerUserId !== buyerId) {
      throw new AppError("FORBIDDEN", {
        message: "Only the buyer can request revisions",
      });
    }

    if (escrow.status !== EscrowStatus.SUBMITTED) {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Can only request revision when work is SUBMITTED",
        currentStatus: escrow.status,
      });
    }

    // Transition back to IN_PROGRESS
    const revised = await transitionEscrow(
      escrow.id,
      EscrowStatus.IN_PROGRESS,
      buyerId,
      {
        method: "buyerRequestRevision",
        feedback,
        requestedAt: new Date(),
      },
      tx,
    );

    // Notify seller with feedback
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.REVISION_REQUESTED,
      `📝 Buyer requested revisions for Escrow ${escrow.escrowId}: ${feedback}`,
      escrow.id,
    );

    return revised;
  });
}

/**
 * Buyer opens a dispute
 * Status transition: SUBMITTED/VERIFIED/IN_PROGRESS -> DISPUTED
 */
export async function buyerOpenDispute(
  escrowId: string,
  buyerId: string,
  reason: string,
): Promise<Escrow> {
  return await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new AppError("ESCROW_NOT_FOUND", { message: "Escrow not found" });
    }

    if (escrow.buyerUserId !== buyerId) {
      throw new AppError("FORBIDDEN", {
        message: "Only the buyer can open a dispute",
      });
    }

    // Transition to DISPUTED
    const disputed = await transitionEscrow(
      escrow.id,
      EscrowStatus.DISPUTED,
      buyerId,
      {
        method: "buyerOpenDispute",
        reason,
        disputedAt: new Date(),
      },
      tx,
    );

    // Notify seller
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.DISPUTE_OPENED,
      `⚠️ Dispute opened for Escrow ${escrow.escrowId}: ${reason}`,
      escrow.id,
    );

    // Notify admins (optional/TODO)

    return disputed;
  });
}

/**
 * Trigger side effects for VERIFIED state
 */
async function triggerVerifiedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - VERIFIED] Buyer approved work for escrow ${escrow.escrowId}`,
    );

    // Funds will be released when buyer explicitly clicks "Release Funds"
    // or automatically after a grace period (if implemented)

    // This is just logging that verification (buyer approval) happened
    console.log(
      `[Side Effect - VERIFIED] Escrow ${escrow.escrowId} ready for release`,
    );
  } catch (error) {
    console.error("[Side Effect - VERIFIED] Error:", error);
  }
}

/**
 * Trigger side effects for RELEASED state
 */
async function triggerReleasedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - RELEASED] Marking completion and updating reputation for escrow ${escrow.escrowId}`,
    );

    // Update buyer reputation
    updateUserReputation(escrow.buyerUserId).catch((error) => {
      console.error(
        "[Side Effect - RELEASED] Buyer reputation update failed:",
        error,
      );
    });

    // Update seller reputation
    updateUserReputation(escrow.sellerUserId).catch((error) => {
      console.error(
        "[Side Effect - RELEASED] Seller reputation update failed:",
        error,
      );
    });

    // Notify parties
    // Notify Seller
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.ESCROW_RELEASED,
      `Escrow ${escrow.escrowId} has been released! Funds should appear in your wallet.`,
      escrow.id,
    );

    // Notify Buyer (confirmation)
    await NotificationService.createNotification(
      escrow.buyerUserId,
      NotificationType.ESCROW_RELEASED,
      `Escrow ${escrow.escrowId} released successfully.`,
      escrow.id,
    );

    console.log(
      `[Completion] Escrow ${escrow.escrowId} successfully released and marked complete`,
    );

    // Post-release balance verification (async, non-blocking)
    (async () => {
      try {
        // Wait 5 seconds for transaction to propagate
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const seller = await prisma.user.findUnique({
          where: { id: escrow.sellerUserId },
          select: { walletAddress: true, email: true },
        });

        if (seller?.walletAddress) {
          const sellerBalance = await getAddressBalance(seller.walletAddress);

          console.log("━".repeat(80));
          console.log("💰 POST-RELEASE BALANCE CHECK");
          console.log("━".repeat(80));
          console.log("   Seller email:", seller.email);
          console.log("   Seller wallet:", seller.walletAddress);
          console.log(
            "   Seller balance after release:",
            sellerBalance.balance,
            "BCH",
          );
          if (escrow.txHash) {
            console.log(
              "   Explorer: https://blockchair.com/bitcoin-cash/transaction/" +
                escrow.txHash,
            );
          }

          // Update seller trust score on successful release
          updateTrustScore(escrow.sellerUserId).catch((error) => {
            console.error(
              `[Side Effect - RELEASED] Trust score update failed for seller ${escrow.sellerUserId}:`,
              error,
            );
          });
          console.log("━".repeat(80));
        }
      } catch (balanceError) {
        console.error(
          "[Side Effect - RELEASED] Post-release balance check failed:",
          balanceError,
        );
      }
    })();
  } catch (error) {
    console.error("[Side Effect - RELEASED] Error:", error);
  }
}

/**
 * Trigger side effects for DISPUTED state
 */
async function triggerDisputedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - DISPUTED] Logging dispute for escrow ${escrow.escrowId}`,
    );

    // Log dispute opening
    console.log(
      `[Dispute] Escrow ${escrow.escrowId} entered dispute status. ` +
        `Manual resolution required.`,
    );

    // Notification is handled by the openDispute or transition caller to allow custom messages
    // This side effect ensures system consistency if state is changed via other means
  } catch (error) {
    console.error("[Side Effect - DISPUTED] Error:", error);
  }
}

/**
 * Trigger side effects for REFUNDED state
 */
async function triggerRefundedSideEffects(escrow: Escrow): Promise<void> {
  try {
    console.log(
      `[Side Effect - REFUNDED] Processing refund for escrow ${escrow.escrowId}`,
    );

    // Notify Buyer
    await NotificationService.createNotification(
      escrow.buyerUserId,
      NotificationType.ESCROW_REFUNDED,
      `Escrow ${escrow.escrowId} has been refunded to you.`,
      escrow.id,
    );

    // Notify Seller
    await NotificationService.createNotification(
      escrow.sellerUserId,
      NotificationType.ESCROW_REFUNDED,
      `Escrow ${escrow.escrowId} has been refunded to the buyer.`,
      escrow.id,
    );

    // Update seller trust score on refund (negative signal)
    updateTrustScore(escrow.sellerUserId).catch((error) => {
      console.error(
        `[Side Effect - REFUNDED] Trust score update failed for seller ${escrow.sellerUserId}:`,
        error,
      );
    });
  } catch (error) {
    console.error("[Side Effect - REFUNDED] Error:", error);
  }
}

/**
 * Core state machine transition function
 *
 * This is the ONLY way to change escrow status. All status mutations MUST go through this function.
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param nextState - Target state to transition to
 * @param userId - Optional user ID who triggered the transition
 * @param metadata - Optional metadata about the transition
 * @returns Updated escrow
 * @throws Error if transition is not allowed or escrow not found
 */
export async function transitionEscrow(
  escrowId: string,
  nextState: EscrowStatus,
  userId?: string,
  metadata?: Record<string, any>,
  tx: Prisma.TransactionClient = prisma,
): Promise<Escrow> {
  // Fetch current escrow
  let escrow = await tx.escrow.findUnique({ where: { escrowId } });
  if (!escrow) {
    escrow = await tx.escrow.findUnique({ where: { id: escrowId } });
  }

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND", { escrowId });
  }

  const currentState = escrow.status;

  // Check if transition is allowed
  if (!isTransitionAllowed(currentState, nextState)) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      fromState: currentState,
      toState: nextState,
      allowed: ALLOWED_TRANSITIONS.get(currentState),
    });
  }

  // Update data object
  const updateData: any = { status: nextState };

  // Update timestamp for this state
  const timestampField = getTimestampField(nextState);
  if (timestampField) {
    updateData[timestampField] = new Date();
  }

  // Save escrow
  const updatedEscrow = await tx.escrow.update({
    where: { id: escrow.id },
    data: updateData,
  });

  // Log transition
  if (tx !== prisma) {
    // In transaction, await and propagate errors
    await logStateTransition(
      updatedEscrow.id,
      currentState,
      nextState,
      userId,
      metadata,
      tx,
    );
  } else {
    // Non-blocking for non-transactional calls (original behavior)
    logStateTransition(
      updatedEscrow.id,
      currentState,
      nextState,
      userId,
      metadata,
    ).catch((error) => {
      console.error("[State Machine] Logging failed:", error);
    });
  }

  // Trigger side effects (Async, detached from transaction for now as they involve independent services/notifications)
  // Note: transactional integrity is prioritized for DB consistency. Side effects like notifications happen "after" (or loosely coupled).
  // Ideally, side effects should strictly happen 'after commit', but here we just fire them.
  switch (nextState) {
    case EscrowStatus.FUNDED:
      triggerFundedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] FUNDED side effects failed:", error);
      });
      break;

    case EscrowStatus.SUBMITTED:
      triggerSubmittedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] SUBMITTED side effects failed:", error);
      });
      break;

    case EscrowStatus.VERIFIED:
      triggerVerifiedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] VERIFIED side effects failed:", error);
      });
      break;

    case EscrowStatus.RELEASED:
      triggerReleasedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] RELEASED side effects failed:", error);
      });
      break;

    case EscrowStatus.REFUNDED:
      triggerRefundedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] REFUNDED side effects failed:", error);
      });
      break;

    case EscrowStatus.DISPUTED:
      triggerDisputedSideEffects(updatedEscrow).catch((error) => {
        console.error("[State Machine] DISPUTED side effects failed:", error);
      });
      break;
  }

  return updatedEscrow;
}

// Type definition for Escrow with relations
export type EscrowWithDetails = Escrow & {
  buyer?: User;
  seller?: User;
  transactions?: Transaction[];
  disputes?: any[];
  stateTransitions?: any[];
};

/**
 * Escrow creation result
 */
export interface CreateEscrowResult {
  escrow: {
    id: string;
    escrowId: string;
    buyerUserId: string;
    sellerUserId: string;
    amountBCH: number;
    description: string;
    escrowAddress: string;
    status: EscrowStatus;
    expiresAt?: Date;
    createdAt: Date;
  };
}

/**
 * Creates a new escrow transaction
 * Status transition: null → CREATED → AWAITING_FUNDING
 *
 * @param buyerEmail - Email of buyer (user creating escrow)
 * @param sellerEmail - Email of seller
 * @param amountBCH - Amount in BCH
 * @param description - Escrow description/purpose
 * @param expiryHours - Hours until escrow expires (optional)
 * @returns Created escrow details with payment address
 */
export async function createEscrow(
  buyerEmail: string,
  sellerEmail: string,
  amountBCH: number,
  description: string,
  expiryHours?: number,
): Promise<CreateEscrowResult> {
  // Get buyer
  const buyer = await getUserByEmail(buyerEmail);
  if (!buyer) {
    throw new AppError("USER_NOT_FOUND", { email: buyerEmail, role: "buyer" });
  }

  // Get seller
  const seller = await getUserByEmail(sellerEmail);
  if (!seller) {
    throw new AppError("USER_NOT_FOUND", {
      email: sellerEmail,
      role: "seller",
    });
  }

  // Cannot create escrow to yourself
  if (buyer.id === seller.id) {
    throw new AppError("INVALID_INPUT", {
      message: "Cannot create escrow to yourself",
    });
  }

  // Generate BCH wallet for this escrow
  const { address: escrowAddress, encryptedPrivateKey } =
    generateEncryptedWallet();

  // Generate human-readable escrow ID
  const escrowId = generateEscrowId();

  // Calculate expiry date if provided, otherwise use config default
  const durationHours = expiryHours || config.escrow.defaultExpiryHours;

  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  // Create escrow in CREATED state
  const escrow = await prisma.escrow.create({
    data: {
      id: generateId(),
      escrowId,
      buyerUserId: buyer.id,
      sellerUserId: seller.id,
      amountBCH,
      description,
      escrowAddress: escrowAddress,
      privateKeyEncrypted: encryptedPrivateKey,
      status: EscrowStatus.CREATED,
      expiresAt: expiresAt || null,
    },
  });

  // Transition to AWAITING_FUNDING
  await transitionEscrow(escrow.id, EscrowStatus.AWAITING_FUNDING, buyer.id, {
    method: "createEscrow",
  });

  return {
    escrow: {
      id: escrow.id,
      escrowId: escrow.escrowId,
      buyerUserId: buyer.id,
      sellerUserId: seller.id,
      amountBCH: escrow.amountBCH,
      description: escrow.description,
      escrowAddress: escrow.escrowAddress,
      status: escrow.status,
      expiresAt: escrow.expiresAt || undefined,
      createdAt: escrow.createdAt,
    },
  };
}

/**
 * Fund escrow from buyer's internal wallet
 *
 * @param escrowId - Escrow ID
 * @param userId - User ID (must be buyer)
 */
export async function fundEscrowFromWallet(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  const escrow = await getEscrow(escrowId, userId);

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND", { escrowId });
  }

  // Verify user is buyer
  if (escrow.buyerUserId !== userId) {
    throw new AppError("UNAUTHORIZED", {
      message: "Only buyer can fund escrow",
    });
  }

  // Verify status
  if (
    escrow.status !== EscrowStatus.AWAITING_FUNDING &&
    escrow.status !== EscrowStatus.PENDING
  ) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: `Cannot fund escrow in ${escrow.status} state`,
      currentStatus: escrow.status,
    });
  }

  // Get buyer with wallet secrets
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!buyer || !buyer.walletAddress || !buyer.privateKeyEncrypted) {
    throw new AppError("WALLET_NOT_FOUND", {
      message: "Buyer wallet not configured",
    });
  }

  // Check balance (optional optimization, since createTransaction also checks)
  const balance = await getAddressBalance(buyer.walletAddress);
  if (balance.confirmed < escrow.amountBCH) {
    throw new AppError("INSUFFICIENT_FUNDS", {
      required: escrow.amountBCH,
      available: balance.confirmed,
    });
  }

  // Decrypt private key
  const privateKey = decryptPrivateKey(buyer.privateKeyEncrypted);

  // Create Transaction: Buyer Wallet -> Escrow Wallet
  let txId: string;
  try {
    console.log(`[FundEscrow] Creating transaction...`);
    txId = await createTransaction(
      buyer.walletAddress,
      escrow.escrowAddress,
      escrow.amountBCH,
      privateKey,
    );
    console.log(`[FundEscrow] Transaction created successfully.`);
  } catch (error: any) {
    console.error(`[FundEscrow] Tx creation failed:`, error);
    throw new AppError("PAYMENT_FAILED", {
      message: "Failed to create funding transaction",
      details: error.message,
    });
  }

  // ============================================================================
  // CRITICAL SECTION: Broadcast and immediately save to database
  // ============================================================================
  let txHash: string;

  try {
    console.log(`[FundEscrow] Broadcasting transaction...`);
    txHash = await broadcastTransaction(txId);
    console.log(`[FundEscrow] ✅ Broadcast successful. TxHash: ${txHash}`);
  } catch (error: any) {
    console.error(`[FundEscrow] ❌ Broadcast failed:`, error);
    throw new AppError("PAYMENT_FAILED", {
      message: "Failed to broadcast transaction",
      details: error.message,
    });
  }

  // IMMEDIATELY save txHash to database (in a transaction for atomicity)
  let updatedEscrow: Escrow;

  try {
    updatedEscrow = await prisma.$transaction(
      async (tx) => {
        // 1. Save txHash immediately
        await tx.escrow.update({
          where: { id: escrow.id },
          data: { txHash: txHash },
        });

        // 2. Transition to FUNDING_IN_PROGRESS
        const transitioned = await transitionEscrow(
          escrow.id,
          EscrowStatus.FUNDING_IN_PROGRESS,
          userId,
          {
            method: "fundEscrowFromWallet",
            txHash,
            step: "BROADCAST_COMPLETE",
          },
          tx,
        );

        // 3. Record Transaction immediately
        await tx.transaction.create({
          data: {
            id: generateId(),
            escrowId: escrow.id,
            txHash,
            amountBCH: escrow.amountBCH,
            confirmations: 0,
            direction: TransactionDirection.INBOUND,
            createdAt: new Date(),
          },
        });

        return transitioned;
      },
      {
        timeout: 15000, // 15 second timeout for DB operations
      },
    );

    console.log(`[FundEscrow] ✅ Database updated with txHash: ${txHash}`);
    console.log(`[FundEscrow] ✅ Escrow transitioned to FUNDING_IN_PROGRESS`);
  } catch (dbError: any) {
    // Database update failed after broadcast - LOG CRITICALLY
    console.error("━".repeat(80));
    console.error(
      "🚨 CRITICAL ERROR: Transaction broadcasted but DB update failed!",
    );
    console.error("━".repeat(80));
    console.error("Escrow ID:", escrow.id);
    console.error("Transaction Hash:", txHash);
    console.error("User ID:", userId);
    console.error("Amount:", escrow.amountBCH, "BCH");
    console.error("Error:", dbError);
    console.error("━".repeat(80));
    console.error(
      "⚠️  MANUAL RECOVERY NEEDED - Transaction is on blockchain but not in DB",
    );
    console.error("━".repeat(80));

    // Return a special error that includes the txHash for manual recovery
    throw new AppError("DATABASE_UPDATE_FAILED", {
      message:
        "Transaction sent successfully but database update failed. Please contact support.",
      txHash: txHash,
      escrowId: escrow.id,
      requiresManualRecovery: true,
    });
  }

  // ============================================================================
  // MONITORING SECTION: This can fail without losing funds
  // ============================================================================

  // Monitor for transaction (this can fail safely)
  const { waitForTransactionInMempool } =
    await import("@/lib/bch/transaction-monitor");

  try {
    console.log(`[FundEscrow] Monitoring for transaction ${txHash}...`);
    await waitForTransactionInMempool(
      escrow.escrowAddress,
      txHash,
      escrow.amountBCH,
    );
    console.log(`[FundEscrow] ✅ Transaction verified on-chain (or mempool).`);
  } catch (monitorError: any) {
    console.error(`[FundEscrow] ⚠️  Monitoring timeout/error:`, monitorError);

    // Monitoring failed, but transaction is already recorded in DB
    if (monitorError.code === "TRANSACTION_TIMEOUT") {
      console.warn(
        `[FundEscrow] Transaction ${txHash} not detected yet, but it's recorded in DB.`,
      );
      console.warn(`[FundEscrow] Background job will verify it later.`);
      return updatedEscrow;
    }

    // For other errors, also just log and return
    console.error(`[FundEscrow] Monitoring error (non-fatal):`, monitorError);
    return updatedEscrow;
  }

  // If verified, transition to FUNDED
  try {
    const fundedEscrow = await transitionEscrow(
      escrow.id,
      EscrowStatus.FUNDED,
      userId,
      {
        method: "fundEscrowFromWallet",
        txHash,
        confirmations: 0,
        amountBCH: escrow.amountBCH,
        verified: true,
      },
    );

    console.log(`[FundEscrow] ✅ Escrow ${escrow.id} transitioned to FUNDED.`);
    return fundedEscrow;
  } catch (transitionError: any) {
    console.error(
      `[FundEscrow] Failed to transition to FUNDED:`,
      transitionError,
    );
    console.warn(
      `[FundEscrow] Escrow remains in FUNDING_IN_PROGRESS. Background job will complete.`,
    );
    return updatedEscrow;
  }
}

/**
 * Cancels an escrow that hasn't been funded yet
 * Only the buyer can cancel, and only when status is AWAITING_FUNDING or PENDING
 *
 * @param escrowId - Escrow ID
 * @param userId - User requesting cancellation (must be buyer)
 * @returns Cancelled escrow
 */
export async function cancelEscrow(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  const escrow = await getEscrow(escrowId, userId);

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND", { escrowId });
  }

  // Only the buyer can cancel
  if (escrow.buyerUserId !== userId) {
    throw new AppError("FORBIDDEN", {
      message: "Only the buyer can cancel an escrow",
    });
  }

  // Only allow cancellation when no funds are deposited
  const status = escrow.status.toUpperCase();
  if (
    status !== "AWAITING_FUNDING" &&
    status !== "PENDING" &&
    status !== "CREATED"
  ) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: "Escrow can only be cancelled before funding",
      currentStatus: escrow.status,
    });
  }

  const cancelled = await transitionEscrow(
    escrow.id,
    EscrowStatus.CANCELLED,
    userId,
    { reason: "Cancelled by buyer" },
  );

  return cancelled;
}

/**
 * Escrow creation result
 */
// ... (skip to getEscrow)

/**
 * Gets escrow by ID with authorization check
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID
 * @returns Escrow details with populated user data
 */
export async function getEscrow(
  escrowId: string,
  userId: string,
): Promise<EscrowWithDetails | null> {
  // Try to find by escrowId first, then by id
  const escrow1 = await prisma.escrow.findUnique({
    where: { escrowId },
    include: {
      buyer: true,
      seller: true,
      disputes: true,
      stateTransitions: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  let escrow = escrow1;

  if (!escrow) {
    escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        buyer: true,
        seller: true,
        disputes: true,
        stateTransitions: {
          orderBy: { timestamp: "desc" },
        },
      },
    });
  }

  if (!escrow) {
    return null;
  }

  // Check authorization - must be buyer or seller
  const isBuyer = escrow.buyerUserId === userId;
  const isSeller = escrow.sellerUserId === userId;

  if (!isBuyer && !isSeller) {
    throw new AppError("FORBIDDEN", {
      message: "Unauthorized to view this escrow",
    });
  }

  // Ensure we consistently use 'buyer' and 'seller' instead of 'buyerUserId' as object
  return escrow;
}

/**
 * Gets escrow with transaction confirmations
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID
 * @returns Escrow with confirmations count
 */
export async function getEscrowWithConfirmations(
  escrowId: string,
  userId: string,
): Promise<{ escrow: EscrowWithDetails; confirmations: number } | null> {
  const escrow = await getEscrow(escrowId, userId);

  if (!escrow) {
    return null;
  }

  // Get transaction confirmations if funded
  let confirmations = 0;
  if (escrow.txHash) {
    const transaction = await prisma.transaction.findUnique({
      where: { txHash: escrow.txHash },
    });
    if (transaction) {
      confirmations = transaction.confirmations;
    }
  }

  return { escrow, confirmations };
}

/**
 * Checks if escrow wallet has been funded and updates status
 * Status transition: AWAITING_FUNDING → FUNDED (or PENDING → FUNDED for legacy)
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @returns Updated escrow or null if not found
 */
export async function checkEscrowFunding(
  escrowId: string,
): Promise<Escrow | null> {
  // Find escrow
  let escrow = await prisma.escrow.findUnique({ where: { escrowId } });
  if (!escrow) {
    escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
  }

  if (!escrow) {
    return null;
  }

  // Only check if still in AWAITING_FUNDING or PENDING state
  if (
    escrow.status !== EscrowStatus.AWAITING_FUNDING &&
    escrow.status !== EscrowStatus.PENDING
  ) {
    return escrow;
  }

  // Check address balance
  const balance = await getAddressBalance(escrow.escrowAddress);

  // Check if funded with required amount
  if (balance.balance >= escrow.amountBCH) {
    // Get transactions to record the funding tx
    const transactions = await getAddressTransactions(escrow.escrowAddress);

    if (transactions.length > 0) {
      const fundingTx = transactions[0];

      return await prisma.$transaction(async (tx) => {
        // Update txHash before transition
        await tx.escrow.update({
          where: { id: escrow.id },
          data: { txHash: fundingTx.txid },
        });

        // Transition to FUNDED state
        const updatedEscrow = await transitionEscrow(
          escrow.id,
          EscrowStatus.FUNDED,
          undefined,
          {
            method: "checkEscrowFunding",
            txHash: fundingTx.txid,
            confirmations: fundingTx.confirmations,
          },
          tx,
        );

        // Create transaction record
        await tx.transaction.create({
          data: {
            id: generateId(),
            escrowId: escrow.id,
            txHash: fundingTx.txid,
            amountBCH: escrow.amountBCH,
            confirmations: fundingTx.confirmations,
            direction: TransactionDirection.INBOUND,
          },
        });

        return updatedEscrow;
      });
    }
  }

  return escrow;
}
/**
 * Funds an escrow from the user's permanent wallet
 * Authorization: User must be the buyer
 *
 * @param escrowId - Escrow ID
 * @param userId - User ID (Buyer)
 * @returns Updated Escrow
 */
export async function fundEscrowFromUserWallet(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  // Get escrow (OUTSIDE transaction for initial validation)
  const escrow = await getEscrow(escrowId, userId);
  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND", { escrowId });
  }

  // Check auth
  if (escrow.buyerUserId !== userId) {
    throw new AppError("FORBIDDEN", {
      message: "Only the buyer can fund this escrow",
    });
  }

  // Check state
  if (
    escrow.status !== EscrowStatus.AWAITING_FUNDING &&
    escrow.status !== EscrowStatus.PENDING
  ) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: "Escrow is not awaiting funding",
      currentStatus: escrow.status,
    });
  }

  // Get User with wallet info
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (
    !user ||
    !user.walletAddress ||
    !user.privateKeyEncrypted ||
    !user.walletPublicKey
  ) {
    throw new AppError("WALLET_NOT_FOUND", {
      message: "User wallet not set up",
    });
  }

  // Check User Wallet Balance
  const balance = await getAddressBalance(user.walletAddress);
  const requiredAmount = escrow.amountBCH + config.escrow.minerFeeBuffer;

  console.log(`[FundEscrow] Attempting to fund escrow ${escrow.id}`);
  console.log(`[FundEscrow] User Wallet: ${user.walletAddress}`);
  console.log(`[FundEscrow] User Balance: ${balance.balance} BCH`);
  console.log(`[FundEscrow] Required: ${requiredAmount} BCH`);

  if (balance.balance < requiredAmount) {
    console.error(
      `[FundEscrow] Insufficient funds. Balance: ${balance.balance}, Required: ${requiredAmount}`,
    );
    throw new AppError("INSUFFICIENT_FUNDS", {
      message: "Insufficient funds in user wallet",
      required: requiredAmount,
      available: balance.balance,
    });
  }

  // Decrypt User Key
  const userPrivateKey = decryptPrivateKey(user.privateKeyEncrypted);

  // Create Transaction: User Wallet -> Escrow Wallet
  let rawTx: string;
  try {
    console.log(`[FundEscrow] Creating transaction...`);
    rawTx = await createTransaction(
      user.walletAddress,
      escrow.escrowAddress,
      escrow.amountBCH,
      userPrivateKey,
    );
    console.log(`[FundEscrow] Transaction created successfully.`);
  } catch (error: any) {
    console.error(`[FundEscrow] Tx creation failed:`, error);
    throw new AppError("PAYMENT_FAILED", {
      message: "Failed to create funding transaction",
      details: error.message,
    });
  }

  // ============================================================================
  // CRITICAL SECTION: Broadcast and immediately save to database
  // ============================================================================
  let txHash: string;

  try {
    console.log(`[FundEscrow] Broadcasting transaction...`);
    txHash = await broadcastTransaction(rawTx);
    console.log(`[FundEscrow] ✅ Broadcast successful. TxHash: ${txHash}`);
  } catch (error: any) {
    console.error(`[FundEscrow] ❌ Broadcast failed:`, error);
    throw new AppError("PAYMENT_FAILED", {
      message: "Failed to broadcast transaction",
      details: error.message,
    });
  }

  // IMMEDIATELY save txHash to database (in a transaction for atomicity)
  // This ensures we NEVER lose track of a broadcasted transaction
  let updatedEscrow: Escrow;

  try {
    updatedEscrow = await prisma.$transaction(
      async (tx) => {
        // 1. Save txHash immediately
        await tx.escrow.update({
          where: { id: escrow.id },
          data: { txHash: txHash },
        });

        // 2. Transition to FUNDING_IN_PROGRESS
        const transitioned = await transitionEscrow(
          escrow.id,
          EscrowStatus.FUNDING_IN_PROGRESS,
          userId,
          {
            method: "fundEscrowFromUserWallet",
            txHash,
            step: "BROADCAST_COMPLETE",
          },
          tx,
        );

        // 3. Record Transaction immediately
        await tx.transaction.create({
          data: {
            id: generateId(),
            escrowId: escrow.id,
            txHash,
            amountBCH: escrow.amountBCH,
            confirmations: 0,
            direction: TransactionDirection.INBOUND,
            createdAt: new Date(),
          },
        });

        return transitioned;
      },
      {
        timeout: 15000, // 15 second timeout for DB operations
      },
    );

    console.log(`[FundEscrow] ✅ Database updated with txHash: ${txHash}`);
    console.log(`[FundEscrow] ✅ Escrow transitioned to FUNDING_IN_PROGRESS`);
  } catch (dbError: any) {
    // Database update failed after broadcast - LOG CRITICALLY
    console.error("━".repeat(80));
    console.error(
      "🚨 CRITICAL ERROR: Transaction broadcasted but DB update failed!",
    );
    console.error("━".repeat(80));
    console.error("Escrow ID:", escrow.id);
    console.error("Transaction Hash:", txHash);
    console.error("User ID:", userId);
    console.error("Amount:", escrow.amountBCH, "BCH");
    console.error("Error:", dbError);
    console.error("━".repeat(80));
    console.error(
      "⚠️  MANUAL RECOVERY NEEDED - Transaction is on blockchain but not in DB",
    );
    console.error("━".repeat(80));

    // Return a special error that includes the txHash for manual recovery
    throw new AppError("DATABASE_UPDATE_FAILED", {
      message:
        "Transaction sent successfully but database update failed. Please contact support.",
      txHash: txHash,
      escrowId: escrow.id,
      requiresManualRecovery: true,
    });
  }

  // ============================================================================
  // MONITORING SECTION: This can fail without losing funds
  // ============================================================================

  // Now monitor for transaction (this can fail safely)
  const { waitForTransactionInMempool } =
    await import("@/lib/bch/transaction-monitor");

  try {
    console.log(`[FundEscrow] Monitoring for transaction ${txHash}...`);
    await waitForTransactionInMempool(
      escrow.escrowAddress,
      txHash,
      escrow.amountBCH,
    );
    console.log(`[FundEscrow] ✅ Transaction verified on-chain (or mempool).`);
  } catch (monitorError: any) {
    console.error(`[FundEscrow] ⚠️  Monitoring timeout/error:`, monitorError);

    // Monitoring failed, but transaction is already recorded in DB
    // Don't throw error - just log and continue
    // The background job will pick it up

    if (monitorError.code === "TRANSACTION_TIMEOUT") {
      console.warn(
        `[FundEscrow] Transaction ${txHash} not detected yet, but it's recorded in DB.`,
      );
      console.warn(`[FundEscrow] Background job will verify it later.`);

      // Return the escrow in FUNDING_IN_PROGRESS state
      // User should see a message like "Transaction broadcasted, awaiting confirmation"
      return updatedEscrow;
    }

    // For other errors, also just log and return
    console.error(`[FundEscrow] Monitoring error (non-fatal):`, monitorError);
    return updatedEscrow;
  }

  // If monitoring succeeded, transition to FUNDED
  try {
    const fundedEscrow = await transitionEscrow(
      escrow.id,
      EscrowStatus.FUNDED,
      userId,
      {
        method: "fundEscrowFromUserWallet",
        txHash,
        confirmations: 0,
        amountBCH: escrow.amountBCH,
        verified: true,
      },
    );

    console.log(`[FundEscrow] ✅ Escrow ${escrow.id} transitioned to FUNDED.`);
    return fundedEscrow;
  } catch (transitionError: any) {
    console.error(
      `[FundEscrow] Failed to transition to FUNDED:`,
      transitionError,
    );

    // Transaction is recorded, just not marked as FUNDED yet
    // Background job will handle this
    console.warn(
      `[FundEscrow] Escrow remains in FUNDING_IN_PROGRESS. Background job will complete.`,
    );
    return updatedEscrow;
  }
}

/**
 * Releases escrow funds to seller
 * Status transition: VERIFIED → RELEASED
 * Note: For backward compatibility, will auto-transition FUNDED → IN_PROGRESS → SUBMITTED → VERIFIED if needed
 * Authorization: Buyer only
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID (must be buyer)
 * @returns Updated escrow
 */
/**
 * Internal helper for releasing escrow
 * Can be reused in other transactions (e.g., dispute resolution)
 */
export async function processEscrowRelease(
  escrowId: string,
  userId: string, // User initiating (buyer or admin/system)
  tx: Prisma.TransactionClient,
): Promise<Escrow> {
  console.log("━".repeat(80));
  console.log("💸 ESCROW RELEASE STARTED");
  console.log("━".repeat(80));
  console.log("Escrow ID:", escrowId);
  console.log("Initiated by:", userId);
  console.log("Timestamp:", new Date().toISOString());
  console.log("━".repeat(80));

  // Step 1: Find escrow
  const escrow = await tx.escrow.findFirst({
    where: { OR: [{ escrowId }, { id: escrowId }] },
    include: { seller: true },
  });

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND");
  }

  console.log("✅ Step 1: Escrow found");
  console.log("   Escrow DB ID:", escrow.id);
  console.log("   Escrow Public ID:", escrow.escrowId);
  console.log("   Current Status:", escrow.status);
  console.log("   Escrow Address:", escrow.escrowAddress);
  console.log("   Amount BCH:", escrow.amountBCH);
  console.log("   Seller User ID:", escrow.sellerUserId);

  // NOTE: Authorization check moved to caller or specific logic
  // processEscrowRelease assumes authorization is handled or it's a system action

  // Must be funded or later state
  if (
    escrow.status !== EscrowStatus.FUNDED &&
    escrow.status !== EscrowStatus.IN_PROGRESS &&
    escrow.status !== EscrowStatus.SUBMITTED &&
    escrow.status !== EscrowStatus.VERIFIED
  ) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: `Escrow cannot be released from ${escrow.status} state`,
      currentState: escrow.status,
    });
  }

  // Auto-transition through states if needed (for backward compatibility)
  let currentEscrow: Escrow = escrow;

  if (currentEscrow.status === EscrowStatus.FUNDED) {
    currentEscrow = await transitionEscrow(
      currentEscrow.id,
      EscrowStatus.IN_PROGRESS,
      userId,
      {
        method: "processEscrowRelease",
        auto: true,
      },
      tx,
    );
  }

  if (currentEscrow.status === EscrowStatus.IN_PROGRESS) {
    currentEscrow = await transitionEscrow(
      currentEscrow.id,
      EscrowStatus.SUBMITTED,
      userId,
      {
        method: "processEscrowRelease",
        auto: true,
      },
      tx,
    );
  }

  if (currentEscrow.status === EscrowStatus.SUBMITTED) {
    currentEscrow = await transitionEscrow(
      currentEscrow.id,
      EscrowStatus.VERIFIED,
      userId,
      {
        method: "processEscrowRelease",
        auto: true,
      },
      tx,
    );
  }

  // Now must be in VERIFIED state
  if (currentEscrow.status !== EscrowStatus.VERIFIED) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: "Escrow must be verified before release",
      currentState: currentEscrow.status,
    });
  }

  // Check for active disputes
  const dispute = await tx.dispute.findFirst({
    where: {
      escrowId: currentEscrow.id,
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });

  if (dispute) {
    throw new AppError("DISPUTE_ALREADY_EXISTS", {
      message: "Cannot release escrow with active dispute",
    });
  }

  // Step 2: Verify seller wallet
  if (!(currentEscrow as any).seller) {
    currentEscrow = (await tx.escrow.findUnique({
      where: { id: currentEscrow.id },
      include: { seller: true },
    })) as Escrow;
  }

  const sellerWallet = (currentEscrow as any).seller?.walletAddress;

  console.log("✅ Step 2: Checking seller wallet");
  console.log("   Seller wallet address:", sellerWallet || "❌ NOT FOUND");

  if (!sellerWallet) {
    throw new AppError("WALLET_NOT_FOUND", {
      message: "Seller wallet not set up. Cannot release funds.",
    });
  }

  const sellerAddress = sellerWallet;

  // Step 3: Check escrow balance
  console.log("✅ Step 3: Fetching escrow wallet balance...");
  const balance = await getAddressBalance(currentEscrow.escrowAddress);

  console.log("━".repeat(40));
  console.log("💰 ESCROW WALLET BALANCE:");
  console.log("   Address:", currentEscrow.escrowAddress);
  console.log("   Confirmed:", balance.confirmed, "BCH");
  console.log("   Unconfirmed:", balance.unconfirmed, "BCH");
  console.log("   Total:", balance.balance, "BCH");
  console.log("   Required (escrow amount):", currentEscrow.amountBCH, "BCH");
  console.log("   Miner fee buffer:", config.escrow.minerFeeBuffer, "BCH");
  console.log("━".repeat(40));

  const availableBCH = balance.balance;
  const minerFeeBCH = config.escrow.minerFeeBuffer;
  const amountToSend = availableBCH - minerFeeBCH;

  console.log("   Amount to send to seller:", amountToSend, "BCH");

  if (amountToSend <= 0) {
    console.error("❌ INSUFFICIENT FUNDS IN ESCROW WALLET");
    console.error("   Available:", availableBCH, "BCH");
    console.error("   Fee buffer:", minerFeeBCH, "BCH");
    throw new AppError("INSUFFICIENT_FUNDS", {
      message: `Escrow wallet balance (${availableBCH}) too small to cover fees`,
      available: availableBCH,
      required: minerFeeBCH,
    });
  }

  // Step 4: Decrypt private key
  console.log("✅ Step 4: Decrypting escrow private key...");
  const privateKey = decryptPrivateKey(currentEscrow.privateKeyEncrypted);
  console.log("   Private key decrypted successfully ✅");

  // Step 5: Create transaction
  console.log("✅ Step 5: Creating blockchain transaction...");
  console.log("   FROM:", currentEscrow.escrowAddress);
  console.log("   TO:", sellerAddress);
  console.log("   AMOUNT:", amountToSend, "BCH");

  let rawTx: string;
  try {
    rawTx = await createTransaction(
      currentEscrow.escrowAddress,
      sellerAddress,
      amountToSend,
      privateKey,
    );
    console.log("   Transaction created successfully ✅");
    console.log("   Raw TX length:", rawTx.length, "chars");
  } catch (error: any) {
    console.error("❌ Step 5 FAILED: Transaction creation error");
    console.error("   Error:", error.message);
    console.error("   Metadata:", error.metadata || "none");
    throw new AppError("PAYMENT_FAILED", {
      message: `Failed to create release transaction: ${error.message}`,
      originalError: error.message,
      metadata: error.metadata,
    });
  }

  // Step 6: Broadcast transaction
  console.log("✅ Step 6: Broadcasting transaction to BCH network...");
  let txHash: string;
  try {
    txHash = await broadcastTransaction(rawTx);
    console.log("━".repeat(40));
    console.log("🚀 TRANSACTION BROADCAST SUCCESSFUL!");
    console.log("   TX Hash:", txHash);
    console.log(
      "   Explorer: https://blockchair.com/bitcoin-cash/transaction/" + txHash,
    );
    console.log("━".repeat(40));
  } catch (error: any) {
    console.error("❌ Step 6 FAILED: Broadcast error");
    console.error("   Error:", error.message);
    throw new AppError("PAYMENT_FAILED", {
      message: `Failed to broadcast release transaction: ${error.message}`,
    });
  }

  // Step 7: Update database
  console.log("✅ Step 7: Updating database...");
  await tx.escrow.update({
    where: { id: currentEscrow.id },
    data: { txHash },
  });

  // Transition to RELEASED state
  const updatedEscrow = await transitionEscrow(
    currentEscrow.id,
    EscrowStatus.RELEASED,
    userId,
    {
      method: "processEscrowRelease",
      txHash,
      sellerAddress: sellerAddress,
      amountSent: amountToSend,
      releasedAt: new Date().toISOString(),
    },
    tx,
  );

  // Record transaction
  await tx.transaction.create({
    data: {
      id: generateId(),
      escrowId: currentEscrow.id,
      txHash,
      amountBCH: amountToSend,
      confirmations: 0,
      direction: TransactionDirection.OUTBOUND,
    },
  });

  console.log("━".repeat(80));
  console.log("✅ ESCROW RELEASE COMPLETE!");
  console.log("━".repeat(80));
  console.log("   Escrow ID:", currentEscrow.escrowId);
  console.log("   TX Hash:", txHash);
  console.log("   Amount Sent:", amountToSend, "BCH");
  console.log("   Seller Wallet:", sellerAddress);
  console.log("   Status: RELEASED");
  console.log(
    "   Explorer: https://blockchair.com/bitcoin-cash/transaction/" + txHash,
  );
  console.log("━".repeat(80));

  return updatedEscrow;
}
/**
 * Releases escrow funds to seller
 * Status transition: VERIFIED → RELEASED
 * Note: For backward compatibility, will auto-transition FUNDED → IN_PROGRESS → SUBMITTED → VERIFIED if needed
 * Authorization: Buyer only
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID (must be buyer)
 * @param destinationAddress - Destination BCH address (optional, defaults to seller's profile if implemented)
 * @returns Updated escrow
 */
export async function releaseEscrow(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  return await prisma.$transaction(
    async (tx) => {
      // Find escrow to check auth
      const escrow = await tx.escrow.findFirst({
        where: { OR: [{ escrowId }, { id: escrowId }] },
      });

      if (!escrow) {
        throw new AppError("ESCROW_NOT_FOUND");
      }

      // Only buyer can release via public API
      if (escrow.buyerUserId !== userId) {
        throw new AppError("FORBIDDEN", {
          message: "Only buyer can release escrow",
        });
      }

      // Pass internal processing
      return await processEscrowRelease(escrowId, userId, tx);
    },
    { timeout: 20000 },
  );
}

/**
 * Refunds escrow funds to buyer
 * Status transition: DISPUTED → REFUNDED
 * Note: Will auto-transition to DISPUTED first if not already disputed
 * Authorization: Buyer or seller (if expired)
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID
 * @returns Updated escrow
 */
/**
 * Internal helper for refunding escrow
 * Can be reused in other transactions (e.g., dispute resolution)
 */
export async function processEscrowRefund(
  escrowId: string,
  userId: string, // User initiating
  tx: Prisma.TransactionClient,
): Promise<Escrow> {
  // Find escrow
  const escrow = await tx.escrow.findFirst({
    where: { OR: [{ escrowId }, { id: escrowId }] },
    include: { buyer: true },
  });

  if (!escrow) {
    throw new AppError("ESCROW_NOT_FOUND");
  }

  // NOTE: Authorization check should be done by caller for public API.
  // For internal use (resolution), we assume it's valid.

  // Must be FUNDED or DISPUTED
  if (
    escrow.status !== EscrowStatus.FUNDED &&
    escrow.status !== EscrowStatus.DISPUTED
  ) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: "Escrow must be funded or disputed before refund",
      currentState: escrow.status,
    });
  }

  let currentEscrow: Escrow = escrow;

  // Transition to DISPUTED if not already
  if (currentEscrow.status === EscrowStatus.FUNDED) {
    const isExpired =
      currentEscrow.expiresAt && new Date() > currentEscrow.expiresAt;

    currentEscrow = await transitionEscrow(
      currentEscrow.id,
      EscrowStatus.DISPUTED,
      userId,
      {
        method: "processEscrowRefund",
        reason: isExpired ? "expired" : "manual_refund",
      },
      tx,
    );
  }

  // Check for active disputes
  const dispute = await tx.dispute.findFirst({
    where: {
      escrowId: currentEscrow.id,
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });

  if (dispute) {
    throw new AppError("DISPUTE_ALREADY_EXISTS", {
      message: "Cannot refund escrow with active dispute",
    });
  }

  // Validate destination address
  // Use Buyer's permanent wallet address as requested by verification audit
  const buyerWallet = (escrow as any).buyer?.walletAddress;

  if (!buyerWallet) {
    throw new AppError("WALLET_NOT_FOUND", {
      message: "Buyer wallet not set up. Cannot refund funds.",
    });
  }

  // Use Buyer's permanent address
  const buyerAddress = buyerWallet;

  // Decrypt escrow private key
  const privateKey = decryptPrivateKey(currentEscrow.privateKeyEncrypted);

  // FETCH ACTUAL BALANCE
  const balance = await getAddressBalance(currentEscrow.escrowAddress);
  // Use total balance to allow 0-conf refunds
  const availableBCH = balance.balance;

  // Create and broadcast transaction

  // Deduct miner fee buffer from available balance
  const minerFeeBCH = config.escrow.minerFeeBuffer;
  const amountToSend = availableBCH - minerFeeBCH;

  if (amountToSend <= 0) {
    throw new AppError("INSUFFICIENT_FUNDS", {
      message: `Escrow wallet balance (${availableBCH}) too small to cover fees`,
      available: availableBCH,
      required: minerFeeBCH,
    });
  }

  let rawTx;
  try {
    rawTx = await createTransaction(
      currentEscrow.escrowAddress,
      buyerAddress,
      amountToSend,
      privateKey,
    );
  } catch (error: any) {
    console.error(
      `[Refund] Transaction creation failed for escrow ${currentEscrow.id}.`,
      `Address: ${currentEscrow.escrowAddress}`,
      `Available (Chain): ${availableBCH}`,
      `Amount To Send: ${amountToSend}`,
      `Error: ${error.message}`,
      `Metadata:`,
      error.metadata || "none",
      `Details:`,
      JSON.stringify(error),
    );
    throw new AppError("PAYMENT_FAILED", {
      message: `Payment failed for address ${currentEscrow.escrowAddress}. Details: ${error.message} (Available: ${availableBCH})`,
      originalError: error.message,
      metadata: error.metadata,
    });
  }

  const txHash = await broadcastTransaction(rawTx);

  // Update escrow with transaction hash
  await tx.escrow.update({
    where: { id: currentEscrow.id },
    data: { txHash },
  });

  // Transition to REFUNDED state
  const updatedEscrow = await transitionEscrow(
    currentEscrow.id,
    EscrowStatus.REFUNDED,
    userId,
    {
      method: "processEscrowRefund",
      txHash,
      buyerAddress: buyerAddress,
    },
    tx,
  );

  // Record transaction
  await tx.transaction.create({
    data: {
      id: generateId(),
      escrowId: currentEscrow.id,
      txHash,
      amountBCH: currentEscrow.amountBCH,
      confirmations: 0,
      direction: TransactionDirection.OUTBOUND,
    },
  });

  return updatedEscrow;
}

/**
 * Seller marks work as started
 * Status transition: FUNDED → IN_PROGRESS
 * Authorization: Seller only
 */
export async function startEscrowWork(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  return await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findFirst({
      where: { OR: [{ escrowId }, { id: escrowId }] },
    });

    if (!escrow) {
      throw new AppError("ESCROW_NOT_FOUND");
    }

    if (escrow.sellerUserId !== userId) {
      throw new AppError("FORBIDDEN", {
        message: "Only the seller can start work",
      });
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Can only start work when escrow is FUNDED",
        currentStatus: escrow.status,
      });
    }

    return await transitionEscrow(
      escrow.id,
      EscrowStatus.IN_PROGRESS,
      userId,
      { method: "startEscrowWork" },
      tx,
    );
  });
}

/**
 * Seller submits completed work
 * Status transition: IN_PROGRESS → SUBMITTED
 * Authorization: Seller only
 */
export async function submitEscrowWork(
  escrowId: string,
  userId: string,
  description?: string,
): Promise<Escrow> {
  return await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrow.findFirst({
      where: { OR: [{ escrowId }, { id: escrowId }] },
    });

    if (!escrow) {
      throw new AppError("ESCROW_NOT_FOUND");
    }

    if (escrow.sellerUserId !== userId) {
      throw new AppError("FORBIDDEN", {
        message: "Only the seller can submit work",
      });
    }

    if (escrow.status !== EscrowStatus.IN_PROGRESS) {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Can only submit work when IN_PROGRESS",
        currentStatus: escrow.status,
      });
    }

    // Update description if provided (or append to metadata?)
    // Actually, escrow.description is usually the contract terms.
    // We should store submission details in metadata or a separate field.
    // For now, let's put      // Create transition to SUBMITTED
    await transitionEscrow(
      escrow.id,
      EscrowStatus.SUBMITTED,
      userId,
      {
        method: "submitEscrowWork",
        submissionNote: description,
      },
      tx,
    ); // Pass tx to transition

    // Update escrow with submission content and return the final state
    return await tx.escrow.update({
      where: { id: escrow.id },
      data: {
        submissionContent: description,
      },
    });
  });
}

/**
 * Refunds escrow funds to buyer
 * Status transition: DISPUTED → REFUNDED
 * Note: Will auto-transition to DISPUTED first if not already disputed
 * Authorization: Buyer or seller (if expired)
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID
 * @returns Updated escrow
 */
/**
 * Refunds escrow funds to buyer
 * Status transition: DISPUTED → REFUNDED
 * Note: Will auto-transition to DISPUTED first if not already disputed
 * Authorization: Buyer or seller (if expired)
 *
 * @param escrowId - Escrow ID or MongoDB _id
 * @param userId - Requesting user ID
 * @param destinationAddress - Destination BCH address (required)
 * @returns Updated escrow
 */
export async function refundEscrow(
  escrowId: string,
  userId: string,
): Promise<Escrow> {
  return await prisma.$transaction(
    async (tx) => {
      // Find escrow
      const escrow = await tx.escrow.findFirst({
        where: { OR: [{ escrowId }, { id: escrowId }] },
      });

      if (!escrow) {
        throw new AppError("ESCROW_NOT_FOUND");
      }

      // Authorization check
      const isBuyer = escrow.buyerUserId === userId;
      const isSeller = escrow.sellerUserId === userId;
      const isExpired = escrow.expiresAt && new Date() > escrow.expiresAt;

      if (!isSeller && !(isBuyer && isExpired)) {
        throw new AppError("FORBIDDEN", {
          message: "Unauthorized to refund this escrow",
        });
      }

      return await processEscrowRefund(escrowId, userId, tx);
    },
    { timeout: 20000 },
  );
}

/**
 * Lists escrows for a user
 *
 * @param userId - User ID
 * @param status - Optional status filter
 * @returns Array of escrows
 */
export async function listEscrows(
  userId: string,
  status?: EscrowStatus,
): Promise<EscrowWithDetails[]> {
  const whereClause: any = {
    OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
  };

  if (status) {
    whereClause.status = status;
  }

  const escrows = await prisma.escrow.findMany({
    where: whereClause,
    include: { buyer: true, seller: true },
    orderBy: { createdAt: "desc" },
  });

  return escrows;
}

/**
 * Webhook handler result
 */
export interface WebhookResult {
  tracked: boolean;
  escrowId?: string;
  status?: EscrowStatus;
  confirmations?: number;
  statusChanged?: boolean;
  message: string;
}

/**
 * Handles BCH transaction webhook notifications
 * Updates transaction records and escrow status based on confirmations
 * Status transition: PENDING/AWAITING_FUNDING → FUNDED (when confirmations threshold met)
 *
 * @param address - BCH address that received payment
 * @param txHash - Transaction hash
 * @param amountBCH - Amount received in BCH
 * @param confirmations - Number of confirmations
 * @param minConfirmations - Minimum confirmations required for funding
 * @returns Webhook processing result
 */
export async function handleBchWebhook(
  address: string,
  txHash: string,
  amountBCH: number,
  confirmations: number,
  minConfirmations: number,
): Promise<WebhookResult> {
  // Find escrow by address
  const escrow = await prisma.escrow.findFirst({
    where: { escrowAddress: address },
  });

  if (!escrow) {
    // Not an escrow address we're tracking
    return {
      tracked: false,
      message: "Address not tracked",
    };
  }

  // Update or create transaction record
  let transaction = await prisma.transaction.findUnique({ where: { txHash } });

  if (transaction) {
    // Update existing transaction confirmations
    transaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { confirmations },
    });
  } else {
    // Create new transaction record
    transaction = await prisma.transaction.create({
      data: {
        id: generateId(),
        escrowId: escrow.id,
        txHash,
        amountBCH,
        confirmations: confirmations || 0,
        direction: TransactionDirection.INBOUND,
      },
    });
  }

  // Check if status should be updated to FUNDED
  let statusChanged = false;
  if (
    (escrow.status === EscrowStatus.PENDING ||
      escrow.status === EscrowStatus.AWAITING_FUNDING) &&
    // Check if received amount covers principal + miner fee for release
    amountBCH >= escrow.amountBCH + config.escrow.minerFeeBuffer &&
    confirmations >= minConfirmations
  ) {
    // Update txHash before transition
    await prisma.escrow.update({
      where: { id: escrow.id },
      data: { txHash },
    });

    // Transition to FUNDED state
    await transitionEscrow(escrow.id, EscrowStatus.FUNDED, undefined, {
      method: "handleBchWebhook",
      txHash,
      confirmations,
      amountBCH,
    });
    statusChanged = true;
  }

  return {
    tracked: true,
    escrowId: escrow.escrowId,
    status: escrow.status,
    confirmations,
    statusChanged,
    message: statusChanged ? "Escrow marked as funded" : "Transaction recorded",
  };
}

/**
 * Get all escrows for a user
 *
 * @param userId - User ID
 * @param role - Filter by role: "buyer" | "seller" | "all"
 * @param status - Optional status filter
 * @returns Array of escrows
 */
export async function getUserEscrows(
  userId: string,
  role: "buyer" | "seller" | "all" = "all",
  status?: string | null,
): Promise<Escrow[]> {
  const where: Prisma.EscrowWhereInput = {};

  // Status filter
  if (status && Object.values(EscrowStatus).includes(status as EscrowStatus)) {
    where.status = status as EscrowStatus;
  } else if (status) {
    console.warn(`[getUserEscrows] Invalid status filter ignored: ${status}`);
  }

  // Role filter
  if (role === "buyer") {
    where.buyerUserId = userId;
  } else if (role === "seller") {
    where.sellerUserId = userId;
  } else {
    // Both
    where.OR = [{ buyerUserId: userId }, { sellerUserId: userId }];
  }

  console.log(
    `[getUserEscrows] Fetching for user ${userId}, role ${role}, status ${status || "any"}`,
  );

  return await prisma.escrow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: {
        select: { id: true, email: true, fullName: true, successRate: true },
      },
      seller: {
        select: { id: true, email: true, fullName: true, successRate: true },
      },
    },
  });
}
