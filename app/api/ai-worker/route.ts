import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  extractUrl,
  fetchContent,
  downloadToTemp,
  uploadToGemini,
  deleteFromGemini,
} from "@/lib/utils/ai-helpers";
import { recordAiVerification } from "@/services/ai-verification.service";
import { prisma } from "@/lib/db/prisma";

// Initialize Gemini Client
// WARNING: Ensure GOOGLE_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
);

interface AiTaskPayload {
  taskType: string;
  submissionId: string;
  payload: any;
}

interface AiResponse {
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
 * Real Gemini AI Implementation
 */ async function geminiDecision(
  taskType: string,
  payload: any,
): Promise<AiResponse> {
  let uploadedFile: { uri: string; name: string } | null = null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contentText = payload.submissionContent || payload.description || "";
    const url = extractUrl(contentText);

    console.log(`[AI Worker] Submission text: ${contentText}`);
    console.log(`[AI Worker] Extracted URL: ${url}`);

    // Build content parts for Gemini
    const contentParts: any[] = [];
    let evidenceDescription = "No external link provided.";

    if (url) {
      console.log(`[AI Worker] Found URL: ${url}`);

      // ─── STEP 1: Detect if it's a direct image URL ──────────────────
      const isDirectImage =
        /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) ||
        url.includes("cloudinary.com") ||
        url.includes("imgur.com") ||
        url.includes("i.ibb.co") ||
        url.includes("imagekit.io");

      if (isDirectImage) {
        console.log(
          `[AI Worker] Direct image URL detected. Fetching as base64...`,
        );

        try {
          const axios = require("axios");
          const imageResponse = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; EscrowBot/1.0)",
            },
          });

          const contentType =
            imageResponse.headers["content-type"] || "image/jpeg";
          const base64Data = Buffer.from(imageResponse.data).toString("base64");

          console.log(
            `[AI Worker] ✅ Image fetched successfully. Size: ${imageResponse.data.byteLength} bytes. Type: ${contentType}`,
          );

          // Add image directly as inline data (Gemini can see it)
          contentParts.push({
            inlineData: {
              mimeType: contentType,
              data: base64Data,
            },
          });

          evidenceDescription = `Direct image fetched from ${url} (${contentType}, ${Math.round(imageResponse.data.byteLength / 1024)}KB). The image is included above for your analysis.`;
        } catch (imgError: any) {
          console.error(
            `[AI Worker] ❌ Failed to fetch image:`,
            imgError.message,
          );
          evidenceDescription = `Image URL found (${url}) but could not be fetched: ${imgError.message}. URL exists but content unavailable.`;
        }

        // ─── STEP 2: Try text fetch for web pages/GitHub ────────────────
      } else {
        console.log(`[AI Worker] Non-image URL. Attempting text fetch...`);
        const textContent = await fetchContent(url);

        if (textContent && textContent.data) {
          console.log(
            `[AI Worker] ✅ Text content fetched. Length: ${textContent.data.length}`,
          );
          evidenceDescription = `Web content fetched from ${url}:\n---\n${textContent.data.substring(0, 3000)}\n---`;
        } else {
          // Fall back to File API for large files
          console.log(`[AI Worker] Text fetch failed. Trying file download...`);
          const tempFile = await downloadToTemp(url);

          if (tempFile) {
            console.log(`[AI Worker] Uploading ${tempFile.path} to Gemini...`);
            uploadedFile = await uploadToGemini(
              tempFile.path,
              tempFile.mimeType,
            );

            try {
              require("fs").unlinkSync(tempFile.path);
            } catch (e) {}

            if (uploadedFile) {
              evidenceDescription = `File uploaded to Gemini (${tempFile.mimeType}). URI: ${uploadedFile.uri}`;
              contentParts.push({
                fileData: {
                  mimeType: tempFile.mimeType,
                  fileUri: uploadedFile.uri,
                },
              });
            } else {
              evidenceDescription = `URL found (${url}) but file upload to Gemini failed.`;
            }
          } else {
            evidenceDescription = `URL found (${url}) but could not fetch content (too large or network error).`;
          }
        }
      }
    }

    // ─── Build the prompt ──────────────────────────────────────────────
    const systemPrompt = `
      You are an AI advisor for a Bitcoin Cash escrow verification service.
      Your role is to analyze work submissions and provide RECOMMENDATIONS.

      IMPORTANT RULES:
      1. If an image is provided above, ANALYZE IT CAREFULLY - judge if it looks like a real deliverable
      2. If a URL was provided and content was fetched, verify it matches the task
      3. If content could NOT be fetched, note this but do NOT assume the work doesn't exist
      4. Judge quality based on what you can actually see
      5. A Cloudinary/hosted image URL that loads successfully IS evidence of work

      Response Format (JSON only, no markdown):
      {
        "recommendation": "APPROVE" | "REJECT" | "NEEDS_REVIEW",
        "reason": "2-4 sentence detailed assessment",
        "confidence": 0.0-1.0,
        "findings": {
          "linkAccessible": boolean,
          "contentType": "image|code|document|other|none",
          "apparentCompleteness": "complete|partial|minimal|empty",
          "matchesDescription": boolean,
          "concernsFound": ["array of issues"],
          "positiveSignals": ["array of good signs"]
        }
      }
    `;

    const userPrompt = `
      Task Description: ${payload.description || "Not provided"}
      Seller Submission: ${contentText}
      Evidence Status: ${evidenceDescription}

      Please analyze this submission and provide your recommendation.
    `;

    // Build final parts array for Gemini
    const finalParts = [
      { text: systemPrompt },
      { text: userPrompt },
      ...contentParts, // Image or file data goes here
    ];

    console.log(
      `[AI Worker] Sending to Gemini with ${contentParts.length} media parts...`,
    );

    const result = await model.generateContent(finalParts);
    const response = await result.response;
    const text = response.text();

    console.log(`[AI Worker] Raw Gemini response: ${text}`);

    // Cleanup uploaded file if used
    if (uploadedFile) {
      console.log(`[AI Worker] Cleaning up remote file: ${uploadedFile.name}`);
      await deleteFromGemini(uploadedFile.name);
    }

    // Parse response
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    console.log(`[AI Worker] Parsed result:`, JSON.stringify(parsed, null, 2));

    return parsed;
  } catch (error) {
    console.error("[Gemini AI] Error:", error);
    if (uploadedFile) {
      try {
        await deleteFromGemini(uploadedFile.name);
      } catch (e) {}
    }
    return {
      recommendation: "NEEDS_REVIEW",
      reason:
        "AI processing failed. Manual review required. " +
        (error as Error).message,
      confidence: 0,
      findings: {
        linkAccessible: false,
        contentType: "unknown",
        apparentCompleteness: "unknown",
        matchesDescription: false,
        concernsFound: ["AI processing error"],
        positiveSignals: [],
      },
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn(
        "[AI Worker] No API key found. Defaulting to manual review.",
      );

      // No API key = require manual review
      const fallbackResult: AiResponse = {
        recommendation: "NEEDS_REVIEW",
        reason: "AI service unavailable. Manual review required.",
        confidence: 0,
        findings: {
          linkAccessible: false,
          contentType: "unknown",
          apparentCompleteness: "unknown",
          matchesDescription: false,
          concernsFound: ["AI service not configured"],
          positiveSignals: [],
        },
      };

      // Store the fallback result
      if (taskType === "verify_task_submission" && payload.escrowId) {
        const escrow = await prisma.escrow.findFirst({
          where: { escrowId: payload.escrowId },
        });
        if (escrow) {
          await recordAiVerification(escrow.id, fallbackResult);
        }
      }

      return NextResponse.json({
        success: true,
        data: fallbackResult,
        submissionId,
      });
    }

    // Execute AI logic
    let aiResult: AiResponse;

    if (taskType === "verify_task_submission") {
      aiResult = await geminiDecision(taskType, payload);

      // Store AI recommendation (not decision)
      if (payload.escrowId) {
        const escrow = await prisma.escrow.findFirst({
          where: { escrowId: payload.escrowId },
        });

        if (escrow) {
          await recordAiVerification(escrow.id, aiResult);
          console.log(
            `[AI Worker] Recommendation stored for escrow ${escrow.escrowId}: ${aiResult.recommendation}`,
          );
        } else {
          console.error(`[AI Worker] Escrow not found: ${payload.escrowId}`);
        }
      }
    } else if (taskType === "escrow_funded") {
      // System notification - no verification needed
      aiResult = {
        recommendation: "APPROVE",
        reason: "System notification acknowledged.",
        confidence: 1.0,
        findings: {
          linkAccessible: true,
          contentType: "notification",
          apparentCompleteness: "complete",
          matchesDescription: true,
          concernsFound: [],
          positiveSignals: ["System event"],
        },
      };
    } else {
      // Unknown task type - require manual review
      console.warn(`[AI Worker] Unknown task type: ${taskType}`);
      aiResult = {
        recommendation: "NEEDS_REVIEW",
        reason: "Unknown task type. Manual review required.",
        confidence: 0,
        findings: {
          linkAccessible: false,
          contentType: "unknown",
          apparentCompleteness: "unknown",
          matchesDescription: false,
          concernsFound: ["Unknown task type"],
          positiveSignals: [],
        },
      };
    }

    console.log(
      `[AI Worker] Recommendation for ${submissionId}: ${aiResult.recommendation} (${aiResult.confidence})`,
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
