import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testUrl() {
  const url =
    "https://res.cloudinary.com/dhqdkjrsj/image/upload/v1770849151/logo_bpyfaj.jpg";
  console.log(`Testing direct URL analysis for: ${url}`);

  const result = await model.generateContent([
    `Describe the image available at this link: ${url}. 
     Be specific about visual details to prove you can see it. 
     Do not hallucinate. If you cannot access the internet to view the URL, state that clearly.`,
  ]);

  console.log("\n--- Response ---");
  console.log(result.response.text());
}

testUrl().catch(console.error);
