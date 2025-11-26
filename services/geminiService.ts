import { GoogleGenAI } from "@google/genai";

// Initialize Gemini safely. In a real environment, the API key comes from env vars.
// For this MVP, we handle the case where the key might be missing gracefully in the UI.
const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

/**
 * Generates a creative title for the video based on filenames.
 * This demonstrates Gemini capability, though the main video processing is simulated for the MVP.
 */
export const generateCreativeTitle = async (filenames: string[]): Promise<string> => {
  if (!ai) {
    return "My Awesome Story"; // Fallback if no API key
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      I have a video edited from these clips: ${filenames.join(', ')}.
      Give me a single, short, punchy, fun, "Main Character Energy" title for this video.
      Do not add quotes. Max 5 words.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Main Character Energy";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Main Character Energy";
  }
};
