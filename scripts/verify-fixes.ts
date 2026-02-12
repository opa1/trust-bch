import * as dotenv from "dotenv";
// Try loading .env first, then .env.local
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import {
  extractUrl,
  fetchContent,
  downloadToTemp,
  uploadToGemini,
  deleteFromGemini,
} from "../lib/utils/ai-helpers";
import * as fs from "fs";

const LOG_FILE = "verification_results.txt";

function log(msg: string) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + "\n");
}

function errorLog(msg: string) {
  console.error(msg);
  fs.appendFileSync(LOG_FILE, msg + "\n");
}

async function verify() {
  fs.writeFileSync(LOG_FILE, "Verification 3 (File API) Started\n");
  log("=== 1. Testing AI Helpers (File API Flow) ===");
  log(`API Key Present: ${!!process.env.GOOGLE_API_KEY}`);

  // Test 1: URL Extraction
  const userText =
    "Here is the evidence: https://res.cloudinary.com/dhqdkjrsj/image/upload/v1770849151/logo_bpyfaj.jpg";
  const extractedUrl = extractUrl(userText);
  log(`[Extracted URL]: ${extractedUrl}`);

  // Test 2: File API Flow (Download -> Upload -> Delete)
  if (extractedUrl) {
    log(`\n[Download]: Downloading to temp...`);
    const tempFile = await downloadToTemp(extractedUrl);

    if (tempFile) {
      log(`✅ Download Success!`);
      log(`   Path: ${tempFile.path}`);
      log(`   Mime: ${tempFile.mimeType}`);

      log(`\n[Upload]: Uploading to Google...`);
      const upload = await uploadToGemini(tempFile.path, tempFile.mimeType);

      if (upload) {
        log(`✅ Upload Success!`);
        log(`   URI: ${upload.uri}`);

        log(`\n[Cleanup]: Deleting remote file...`);
        await deleteFromGemini(upload.name);
        log(`✅ Cleanup Success!`);
      } else {
        errorLog("❌ Upload Failed");
      }

      // Local cleanup
      if (fs.existsSync(tempFile.path)) {
        fs.unlinkSync(tempFile.path);
        log(`✅ Local temp file deleted.`);
      }
    } else {
      errorLog("❌ Download Failed (Size limit or Network)");
    }
  } else {
    errorLog("❌ No URL found to test.");
  }
}

verify().catch((e) => errorLog(String(e)));
