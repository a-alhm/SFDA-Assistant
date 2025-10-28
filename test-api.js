require("dotenv").config({ path: ".env" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAPI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  console.log("API Key exists:", !!apiKey);
  console.log("API Key starts with:", apiKey?.substring(0, 10) + "...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test embedding
    const embeddingModelName = process.env.EMBEDDING_MODEL || "text-embedding-004";
    console.log("\n🔢 Testing embedding model:", embeddingModelName);
    const embeddingModel = genAI.getGenerativeModel({
      model: embeddingModelName,
    });
    const result = await embeddingModel.embedContent("Hello world");
    console.log(
      "✅ Embedding works! Vector length:",
      result.embedding.values.length
    );

    // Test chat
    const chatModelName = process.env.CHAT_MODEL || "gemini-pro";
    console.log("\n💬 Testing chat model:", chatModelName);
    const chatModel = genAI.getGenerativeModel({ model: chatModelName });
    const chat = await chatModel.generateContent("Say hello");
    console.log(
      "✅ Chat works! Response:",
      chat.response.text().substring(0, 50)
    );

    console.log("\n🎉 All tests passed! Your API key is working correctly.");
  } catch (error) {
    console.error("\n❌ API test failed:", error.message);
    console.error("\nThis usually means:");
    console.error("1. API key is invalid or expired");
    console.error("2. Generative Language API is not enabled");
    console.error("3. API key doesn't have permission for these models");
    console.error("\nPlease:");
    console.error("- Go to https://aistudio.google.com/apikey");
    console.error("- Create a new API key");
    console.error("- Replace GOOGLE_API_KEY in your .env file");
  }
}

testAPI();
