import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Use require for server-side file manager to avoid ESM issues with some environments
// This is critical for the GoogleAIFileManager to work in this Next.js/TSX setup
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Helper to extract the first HTTP/HTTPS URL from text
 */
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

/**
 * Downloads a file to a temporary path.
 * Enforces 10MB limit.
 * Returns the temp file path or null if failed/too large.
 */
export async function downloadToTemp(
  url: string,
): Promise<{ path: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      console.warn(`[AI Helper] File too large (${contentLength}). Skipping.`);
      return null;
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    // Simple extension handling
    let ext = "tmp";
    if (contentType.includes("image/jpeg")) ext = "jpg";
    else if (contentType.includes("image/png")) ext = "png";
    else if (contentType.includes("pdf")) ext = "pdf";
    else if (contentType.includes("text")) ext = "txt";

    const tempPath = path.join(
      os.tmpdir(),
      `trustbch-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`,
    );

    // Create write stream
    const fileStream = fs.createWriteStream(tempPath);

    // Check if body is available
    if (!res.body) {
      fileStream.close();
      return null;
    }

    // Convert web stream to node stream or use reader
    // @ts-ignore - ReadableStream iterator
    const reader = res.body.getReader();

    let receivedLength = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedLength += value.length;
        if (receivedLength > MAX_SIZE) {
          console.warn(`[AI Helper] Stream exceeded max size. Aborting.`);
          reader.cancel();
          fileStream.destroy(); // Close and destroy
          // Attempt cleanup
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          return null;
        }
        fileStream.write(value);
      }
    } catch (err) {
      console.error("Stream read error:", err);
      fileStream.destroy();
      return null;
    }

    fileStream.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    return { path: tempPath, mimeType: contentType };
  } catch (error) {
    console.error("Error downloading to temp:", error);
    return null;
  }
}

/**
 * Uploads a local file to Google AI File API
 */
export async function uploadToGemini(
  filePath: string,
  mimeType: string,
): Promise<{ uri: string; name: string } | null> {
  try {
    const fileManager = new GoogleAIFileManager(
      process.env.GOOGLE_API_KEY || "",
    );
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: "TrustBCH Submission Evidence",
    });
    return { uri: uploadResponse.file.uri, name: uploadResponse.file.name };
  } catch (error) {
    console.error("Error uploading to Gemini:", error);
    return null;
  }
}

/**
 * Deletes a file from Google AI File API
 */
export async function deleteFromGemini(name: string): Promise<void> {
  try {
    const fileManager = new GoogleAIFileManager(
      process.env.GOOGLE_API_KEY || "",
    );
    await fileManager.deleteFile(name);
  } catch (error) {
    console.warn("Failed to cleanup Gemini file:", error);
  }
}

/**
 * Helper to fetch content from a URL (Legacy / Small Text)
 * Returns text content for non-images
 */
export async function fetchContent(
  url: string,
): Promise<{ mimeType: string; data: string; isImage: boolean } | null> {
  try {
    // Basic text fetch logic for backward compatibility or text files
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";

    if (contentType.startsWith("text/") || contentType.includes("json")) {
      const text = await res.text();
      return {
        mimeType: "text/plain",
        data: text.slice(0, 5000),
        isImage: false,
      };
    }
    // If it's an image, use the temp file flow in the main worker,
    // but for compatibility this function might return null for images now
    // prompting the worker to use downloadToTemp.
    return null;
  } catch (e) {
    return null;
  }
}
