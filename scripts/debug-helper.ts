import { uploadToGemini, downloadToTemp } from "../lib/utils/ai-helpers";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function debug() {
  console.log("Debugging Helper Upload...");
  console.log("API Key Present:", !!process.env.GOOGLE_API_KEY);
  if (process.env.GOOGLE_API_KEY)
    console.log(
      "API Key Start:",
      process.env.GOOGLE_API_KEY.substring(0, 5) + "...",
    );
  else console.warn("WARNING: GOOGLE_API_KEY is missing!");

  const url =
    "https://res.cloudinary.com/dhqdkjrsj/image/upload/v1770849151/logo_bpyfaj.jpg";

  console.log("Downloading...");
  const temp = await downloadToTemp(url);
  if (!temp) {
    console.error("Download failed");
    return;
  }
  console.log("Temp file:", temp.path);

  console.log("Uploading...");
  try {
    // Note: ai-helpers catches errors and returns null.
    // For this debug script, we ideally want to fail loudly, but since we can't change the helper easily just for this run,
    // we rely on the helper's console.error output which should be piped to stdout/stderr.
    const res = await uploadToGemini(temp.path, temp.mimeType);
    console.log("Upload Result:", res);
  } catch (e) {
    console.error("Outer Error (should be caught inside):", e);
  }
}

debug();
