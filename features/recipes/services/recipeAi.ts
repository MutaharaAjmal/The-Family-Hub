// import { GEMINI_URL } from "./recipeConstants";
const GEMINI_URL = process.env.EXPO_PUBLIC_GEMINI_URL;

export type AIRecipeResult = {
  title: string;
  ingredients: string;
  instructions: string;
};

/**
 * URL validation helper
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Call Gemini AI with either a URL or a base64 image
 */
export const getRecipeFromAI = async (
  url?: string,
  base64Image?: string,
): Promise<AIRecipeResult | null> => {
  let parts: any[] = [];

  if (url) {
    parts.push({
      text: `Extract recipe details from this link: ${url}. 
    
    IMPORTANT INSTRUCTIONS:
    1. Detect the language of the source content.
    2. Respond in the ORIGINAL language of the website. If the recipe is in Urdu, provide the JSON values in Urdu script. If it is in English, provide them in English.
    3. Do NOT translate the content.
    
    Respond ONLY in JSON format with these keys: 
    "title" (string), 
    "ingredients" (comma-separated string), 
    "instructions" (string). 
    No extra text.`,
    });
  } else if (base64Image) {
    parts.push({
      text: 'Analyze this food image and provide its full recipe. Respond ONLY in JSON format with keys: "title" (string), "ingredients" (comma-separated string), "instructions" (string). No extra text.',
    });
    parts.push({
      inline_data: { mime_type: "image/jpeg", data: base64Image },
    });
  } else {
    return null;
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates?.length) {
      console.error("Gemini no candidates:", data);
      throw new Error("AI returned no response.");
    }

    const rawText: string = data.candidates[0]?.content?.parts[0]?.text ?? "";
    if (!rawText) throw new Error("AI response was empty.");

    const jsonString = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(jsonString) as AIRecipeResult;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
