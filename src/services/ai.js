import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const getGemmaResponse = async (prompt, history = []) => {
  try {
    // Using the gemma-2-27b model or gemma-7b depending on availability
    // Note: google-genai JS SDK uses different model names than Python sometimes
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Generation Error Details:", error);
    if (error.message?.includes("404")) {
      return "ENGINE ERROR: Model 'gemma-4-31b-it' not found. Please verify the model ID in Google AI Studio or use 'gemini-1.5-flash' as a fallback.";
    }
    return "ENGINE ERROR: Failed to generate solution. Check connection to the workshop.";
  }
};
