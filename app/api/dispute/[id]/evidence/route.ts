import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { addEvidence } from "@/services/dispute.service";
import { NextRequest } from "next/server";
import { z } from "zod";

const addEvidenceSchema = z.object({
  content: z.string().min(1, "Evidence content is required"),
  type: z.enum(["text", "image", "file"]).default("text"),
});

/**
 * POST /api/dispute/[id]/evidence
 * Add evidence to a dispute
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { id: disputeId } = await params;
    const body = await req.json();
    const validatedData = addEvidenceSchema.parse(body);

    const updatedDispute = await addEvidence(disputeId, authResult.userId, {
      type: validatedData.type,
      content: validatedData.content,
    });

    return successResponse({ dispute: updatedDispute });
  } catch (error) {
    return handleError(error);
  }
}
