import { GoogleGenerativeAI } from "@google/generative-ai";
const { GoogleAIFileManager } = require("@google/generative-ai/server");
import * as fs from "fs";
import * as path from "path";

// Initialize Managers
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY || "");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

async function testFileApi() {
  const imageUrl =
    "https://res.cloudinary.com/dhqdkjrsj/image/upload/v1770849151/logo_bpyfaj.jpg";
  const tempPath = path.join(process.cwd(), "temp_logo_test.jpg");

  console.log(`[1] Downloading ${imageUrl} to temp file: ${tempPath}...`);

  // 1. Download to Temp File (simulating strict stream limit)
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const buffer = await res.arrayBuffer();
  fs.writeFileSync(tempPath, Buffer.from(buffer));
  console.log(`[1] Download complete (${buffer.byteLength} bytes).`);

  try {
    // 2. Upload to Google File API
    console.log(`[2] Uploading to Google File API...`);
    const uploadResponse = await fileManager.uploadFile(tempPath, {
      mimeType: "image/jpeg",
      displayName: "Test Implementation Logo",
    });

    console.log(
      `[2] Upload complete: ${uploadResponse.file.uri} (State: ${uploadResponse.file.state})`,
    );

    // 3. Generate Content with URI
    console.log(`[3] Generating content with Gemini using file URI...`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      { text: "Describe this image in detail." },
    ]);

    console.log(`\n[3] AI Response:\n${result.response.text()}\n`);

    // 4. Cleanup Google File
    console.log(`[4] Cleaning up Google File...`);
    await fileManager.deleteFile(uploadResponse.file.name);
    console.log(`[4] Google File deleted.`);
  } catch (error) {
    console.error("Error in File API flow:", error);
  } finally {
    // 5. Cleanup Local Temp File
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log(`[5] Local temp file deleted.`);
    }
  }
}

testFileApi().catch(console.error);
