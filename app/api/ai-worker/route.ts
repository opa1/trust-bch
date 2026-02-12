import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  extractUrl,
  fetchContent,
  downloadToTemp,
  uploadToGemini,
  deleteFromGemini,
} from "@/lib/utils/ai-helpers";

// Initialize Gemini Client
// WARNING: Ensure GOOGLE_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

interface AiTaskPayload {
  taskType: string;
  submissionId: string;
  payload: any;
}

interface AiResponse {
  status: "VERIFIED" | "REJECTED" | "Requires Manual Review";
  reason: string;
  confidence: number;
}

/**
 * Real Gemini AI Implementation
 */
async function geminiDecision(
  taskType: string,
  payload: any,
): Promise<AiResponse> {
  let uploadedFile: { uri: string; name: string } | null = null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Extract and Fetch Evidence
    let evidencePart: any = null;
    let evidenceDescription = "No external link provided.";

    // Look for URL in submissionContent or description
    const contentText = payload.submissionContent || payload.description || "";
    const url = extractUrl(contentText);

    if (url) {
      console.log(`[AI Worker] Found URL: ${url}`);

      // Try text fetch first (lightweight)
      const textContent = await fetchContent(url);

      if (textContent) {
        evidenceDescription = `External Text fetched from ${url}:\n---\n${textContent.data}\n---`;
      } else {
        // It's likely a file/image or large content -> Use File API Flow
        console.log(`[AI Worker] Downloading to temp for File API upload...`);
        const tempFile = await downloadToTemp(url);

        if (tempFile) {
          console.log(`[AI Worker] Uploading ${tempFile.path} to Gemini...`);
          uploadedFile = await uploadToGemini(tempFile.path, tempFile.mimeType);

          // Cleanup local temp file immediately
          try {
            require("fs").unlinkSync(tempFile.path);
          } catch (e) {}

          if (uploadedFile) {
            evidenceDescription = `External File uploaded to Google File API (${tempFile.mimeType}). URI: ${uploadedFile.uri}`;
            evidencePart = {
              fileData: {
                mimeType: tempFile.mimeType,
                fileUri: uploadedFile.uri,
              },
            };
          } else {
            evidenceDescription = "Failed to upload file to Gemini.";
          }
        } else {
          evidenceDescription =
            "Failed to download file (Too large >10MB or Network Error).";
        }
      }
    }

    const systemPrompt = `
            You are an impartial arbitration agent for a Bitcoin Cash escrow service.
            Your job is to verify task submissions based on the evidence provided.
            
            Strictly follow these rules:
            1. Analyze the 'Description' and ANY fetched Evidence (Images or Text).
            2. **CRITICAL**: If the user provides a link, you MUST verify the *content* of that link matches the task description.
            3. If the link content is missing, inaccessible, or does not match the requirements (e.g., photo doesn't show requested item), REJECT the submission.
            4. If the evidence is valid and matches the description (e.g., correct logo design, correct code), mark as VERIFIED.
            5. If no link is provided but the description claims work is done, mark as REJECTED (unless it's a text-only task).
            
            Respond with valid JSON ONLY. No markdown formatting.
            Structure: { "status": "VERIFIED" | "REJECTED", "reason": "string", "confidence": number (0.0-1.0) }
        `;

    const userPrompt = `
            Task Type: ${taskType}
            Payload/Context: ${JSON.stringify(payload)}
            
            External Evidence Status: ${evidenceDescription}
            
            Verify this submission.
        `;

    const parts = [systemPrompt, userPrompt];
    if (evidencePart) {
      parts.push(evidencePart);
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Cleanup Google File if used
    if (uploadedFile) {
      console.log(`[AI Worker] Cleaning up remote file: ${uploadedFile.name}`);
      await deleteFromGemini(uploadedFile.name);
    }

    // Clean up markdown code blocks if Gemini mimics them
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("[Gemini AI] Error:", error);
    // Cleanup on error too
    if (uploadedFile) {
      try {
        await deleteFromGemini(uploadedFile.name);
      } catch (e) {}
    }
    // Fallback to manual review on AI error
    return {
      status: "Requires Manual Review",
      reason: "AI processing failed. " + (error as Error).message,
      confidence: 0,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AiTaskPayload = await req.json();
    const { taskType, payload, submissionId } = body;

    console.log(
      `[AI Worker] Received task: ${taskType} for submission ${submissionId}`,
    );

    if (!process.env.GOOGLE_API_KEY) {
      console.warn(
        "[AI Worker] GOOGLE_API_KEY not found. Attempting to proceed (will likely fail to Manual Review).",
      );
    }

    // --- EXECUTE AI LOGIC ---
    let aiResult: AiResponse;

    if (taskType === "verify_task_submission") {
      aiResult = await geminiDecision(taskType, payload);
    } else {
      // Default auto-approve for specific system tasks (like funding notifications)
      aiResult = {
        status: "VERIFIED",
        reason: "System notification acknowledged.",
        confidence: 1.0,
      };
    }

    console.log(
      `[AI Worker] Decision for ${submissionId}: ${aiResult.status} (${aiResult.confidence})`,
    );

    return NextResponse.json({
      success: true,
      data: aiResult,
      submissionId,
    });
  } catch (error) {
    console.error("[AI Worker] Error processing request:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
