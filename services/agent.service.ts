import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/utils/id";
import { AgentSubmission, SubmissionStatus } from "@prisma/client";
import { Agent } from "@/types";

/**
 * Agent result interface
 */
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  submissionId: string;
}

/**
 * Generate unique submission ID
 */
function generateSubmissionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString("hex");
  return `SUB-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit task to agent endpoint
 *
 * @param taskType - Type of task to submit
 * @param payload - Task payload
 * @param escrowId - Optional escrow ID
 * @returns Agent result
 */
export async function submitTask(
  taskType: string,
  payload: object,
  escrowId?: string,
): Promise<AgentResult> {
  const submissionId = generateSubmissionId();

  // Create submission record
  let submission = await prisma.agentSubmission.create({
    data: {
      id: generateId(),
      submissionId,
      escrowId: escrowId || null,
      taskType,
      taskPayload: payload,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    },
  });

  try {
    // Get agent configuration
    const agentUrl = process.env.AGENT_API_URL;
    const agentApiKey = process.env.AGENT_API_KEY;
    const timeout = parseInt(process.env.AGENT_TIMEOUT_MS || "30000", 10);

    if (!agentUrl) {
      throw new Error("AGENT_API_URL not configured");
    }

    // Update status to processing
    submission = await prisma.agentSubmission.update({
      where: { id: submission.id },
      data: { status: SubmissionStatus.PROCESSING },
    });

    console.log(`[Agent] Submitting task ${submissionId} (type: ${taskType})`);

    // Submit to agent endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(agentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agentApiKey ? { Authorization: `Bearer ${agentApiKey}` } : {}),
      },
      body: JSON.stringify({
        taskType,
        payload,
        submissionId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Agent API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    // Update submission with result
    submission = await prisma.agentSubmission.update({
      where: { id: submission.id },
      data: {
        status: SubmissionStatus.COMPLETED,
        result: result,
        completedAt: new Date(),
      },
    });

    console.log(`[Agent] Task ${submissionId} completed successfully`);

    return {
      success: true,
      data: result,
      submissionId,
    };
  } catch (error) {
    // Update submission with error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    submission = await prisma.agentSubmission.update({
      where: { id: submission.id },
      data: {
        status: SubmissionStatus.FAILED,
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    console.error(`[Agent] Task ${submissionId} failed:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      submissionId,
    };
  }
}

/**
 * Submit task with retry logic
 *
 * @param taskType - Type of task to submit
 * @param payload - Task payload
 * @param escrowId - Optional escrow ID
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Agent result
 */
export async function submitTaskWithRetry(
  taskType: string,
  payload: object,
  escrowId?: string,
  maxRetries: number = 3,
): Promise<AgentResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(
      `[Agent] Attempt ${attempt + 1}/${maxRetries + 1} for task type: ${taskType}`,
    );

    const result = await submitTask(taskType, payload, escrowId);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Check if error is retryable
    const isRetryable =
      result.error?.includes("timeout") ||
      result.error?.includes("network") ||
      result.error?.includes("500") ||
      result.error?.includes("502") ||
      result.error?.includes("503") ||
      result.error?.includes("504");

    if (!isRetryable) {
      console.warn(
        `[Agent] Non-retryable error, stopping retries: ${result.error}`,
      );
      return result;
    }

    // If not last attempt, wait with exponential backoff
    if (attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`[Agent] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  return {
    success: false,
    error: lastError || "Max retries exceeded",
    submissionId: "",
  };
}

/**
 * Get submission status by ID
 *
 * @param submissionId - Submission ID
 * @returns Submission record
 */
export async function getSubmissionStatus(
  submissionId: string,
): Promise<AgentSubmission | null> {
  let submission = await prisma.agentSubmission.findUnique({
    where: { submissionId },
  });
  if (!submission) {
    submission = await prisma.agentSubmission.findUnique({
      where: { id: submissionId },
    });
  }

  return submission;
}

/**
 * Get submissions for an escrow
 *
 * @param escrowId - Escrow ID
 * @returns Array of submissions
 */
export async function getEscrowSubmissions(
  escrowId: string,
): Promise<AgentSubmission[]> {
  return await prisma.agentSubmission.findMany({
    where: { escrowId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retry a failed submission
 *
 * @param submissionId - Submission ID to retry
 * @returns Agent result
 */
export async function retrySubmission(
  submissionId: string,
): Promise<AgentResult> {
  const submission = await getSubmissionStatus(submissionId);

  if (!submission) {
    throw new Error("Submission not found");
  }

  if (submission.status !== SubmissionStatus.FAILED) {
    throw new Error("Only failed submissions can be retried");
  }

  // Increment retry count
  await prisma.agentSubmission.update({
    where: { id: submission.id },
    data: { retryCount: submission.retryCount + 1 },
  });

  // Submit again
  return await submitTask(
    submission.taskType,
    submission.taskPayload as object,
    submission.escrowId?.toString(),
  );
}

/**
 * Get all active agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { successRate: "desc" },
  });

  return agents.map((agent) => ({
    id: agent.agentId, // Use the human-readable ID for display
    name: agent.name,
    email: `${agent.name.toLowerCase().replace(/\s+/g, ".")}@trustbch.com`, // Mock email since not in DB
    reputation: agent.successRate * 5, // Convert 0-1 to 0-5 stars
    completedEscrows: agent.completedTasks,
    isVerified: agent.successRate > 0.9 && agent.disputeRate < 0.05,
  }));
}
