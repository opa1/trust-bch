import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  EscrowStatus,
  DisputeStatus,
  SubmissionStatus,
  User,
  Agent,
} from "@prisma/client";

/**
 * Reputation statistics interface
 */
interface ReputationStats {
  total: number;
  completed: number;
  disputed: number;
}

/**
 * Calculate reputation metrics
 *
 * @param stats - Reputation statistics
 * @returns Success rate and dispute rate
 */
export function calculateReputation(stats: ReputationStats): {
  successRate: number;
  disputeRate: number;
} {
  if (stats.total === 0) {
    return {
      successRate: 0,
      disputeRate: 0,
    };
  }

  const successRate = Math.round((stats.completed / stats.total) * 100);
  const disputeRate = Math.round((stats.disputed / stats.total) * 100);

  return {
    successRate: Math.min(100, Math.max(0, successRate)),
    disputeRate: Math.min(100, Math.max(0, disputeRate)),
  };
}

/**
 * Update user reputation based on escrow history
 *
 * @param userId - User ID to update
 * @returns Updated user
 */
export async function updateUserReputation(
  userId: string,
): Promise<User | null> {
  // Get user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  // Count escrows as buyer
  const buyerEscrows = await prisma.escrow.findMany({
    where: { buyerUserId: userId },
  });
  // Count escrows as seller
  const sellerEscrows = await prisma.escrow.findMany({
    where: { sellerUserId: userId },
  });

  const allEscrows = [...buyerEscrows, ...sellerEscrows];
  const totalEscrows = allEscrows.length;

  // Count completed escrows (RELEASED status)
  const completed = allEscrows.filter(
    (e) => e.status === EscrowStatus.RELEASED,
  ).length;

  // Count disputes involving this user
  const disputes = await prisma.dispute.findMany({
    where: {
      escrowId: { in: allEscrows.map((e) => e.id) },
      status: {
        in: [
          DisputeStatus.OPEN,
          DisputeStatus.UNDER_REVIEW,
          DisputeStatus.RESOLVED,
        ],
      },
    },
  });

  const totalDisputes = disputes.length;

  // Calculate reputation
  const reputation = calculateReputation({
    total: totalEscrows,
    completed,
    disputed: totalDisputes,
  });

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalEscrows,
      completedTasks: completed,
      totalDisputes,
      successRate: reputation.successRate,
      disputeRate: reputation.disputeRate,
    },
  });

  console.log(
    `[Reputation] Updated user ${userId}: ${completed}/${totalEscrows} completed, ${reputation.successRate}% success rate`,
  );

  return updatedUser;
}

/**
 * Update agent reputation based on submission history
 *
 * @param agentId - Agent ID to update
 * @returns Updated agent
 */
export async function updateAgentReputation(
  agentId: string,
): Promise<Agent | null> {
  // Get agent
  // Try finding by unique agentId field if it exists, or just id?
  // In generic schema, agentId might be the ID.
  const agent = await prisma.agent.findUnique({
    where: { agentId },
  });

  if (!agent) {
    return null;
  }

  // Count all submissions
  // Assuming we count all for now as per MVP logic in original file
  const allSubmissions = await prisma.agentSubmission.findMany();

  // Filter submissions that reference this agent (if agentId is stored in payload)
  // For MVP, we'll count all submissions based on original code comment
  const totalSubmissions = allSubmissions.length;

  // Count completed submissions
  const completed = allSubmissions.filter(
    (s) => s.status === SubmissionStatus.COMPLETED,
  ).length;

  // Count disputes against agent decisions
  // For MVP, using simple count of open/review disputes
  const disputes = await prisma.dispute.findMany({
    where: {
      status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
    },
  });

  const totalDisputes = Math.min(disputes.length, totalSubmissions);

  // Calculate reputation
  const reputation = calculateReputation({
    total: totalSubmissions,
    completed,
    disputed: totalDisputes,
  });

  // Update agent
  const updatedAgent = await prisma.agent.update({
    where: { id: agent.id },
    data: {
      totalSubmissions,
      completedTasks: completed,
      totalDisputes,
      successRate: reputation.successRate,
      disputeRate: reputation.disputeRate,
    },
  });

  console.log(
    `[Reputation] Updated agent ${agentId}: ${completed}/${totalSubmissions} completed, ${reputation.successRate}% success rate`,
  );

  return updatedAgent;
}

/**
 * Get user reputation summary
 *
 * @param userId - User ID
 * @returns Reputation summary
 */
export async function getUserReputation(userId: string): Promise<{
  completedTasks: number;
  successRate: number;
  disputeRate: number;
  totalEscrows: number;
  totalDisputes: number;
} | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  return {
    completedTasks: user.completedTasks,
    successRate: user.successRate,
    disputeRate: user.disputeRate,
    totalEscrows: user.totalEscrows,
    totalDisputes: user.totalDisputes,
  };
}

/**
 * Get agent reputation summary
 *
 * @param agentId - Agent ID
 * @returns Reputation summary
 */
export async function getAgentReputation(agentId: string): Promise<{
  completedTasks: number;
  successRate: number;
  disputeRate: number;
  totalSubmissions: number;
  totalDisputes: number;
} | null> {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
  });

  if (!agent) {
    return null;
  }

  return {
    completedTasks: agent.completedTasks,
    successRate: agent.successRate,
    disputeRate: agent.disputeRate,
    totalSubmissions: agent.totalSubmissions,
    totalDisputes: agent.totalDisputes,
  };
}
