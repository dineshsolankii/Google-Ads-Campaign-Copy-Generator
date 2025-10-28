
import { GoogleGenAI, Type } from "@google/genai";
import { AdGroup, Settings } from "../types";

const generateAdGroupsAndCopy = async (
  keywords: string[],
  settings: Settings
): Promise<AdGroup[]> => {
  // Check for required API keys
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new Error("No API keys available. Please set GEMINI_API_KEY or OPENROUTER_API_KEY.");
  }

  const prompt = `
    You are an expert Google Ads campaign manager. Your task is to process a list of marketing keywords, group them into tightly themed ad groups, and write compelling ad copy (headlines and descriptions) for each group.

    **Input Keywords:**
    ${keywords.join(", ")}

    **Instructions:**
    1.  **Analyze and Group:** Analyze the provided keywords and group them into exactly ${settings.numAdGroups} distinct, intent-based ad groups. Each ad group must have a descriptive name and contain between ${settings.minKeywordsPerGroup} and ${settings.maxKeywordsPerGroup} keywords from the prov...
    2.  **Generate Headlines:** For each ad group, generate exactly 8 unique, professional, and high-CTR headlines. Each headline MUST be 30 characters or less. At least 3 headlines per group MUST include one of the keywords from that group. Vary the headlines: use questions, calls-to-action, and fe...
    3.  **Generate Descriptions:** For each ad group, generate exactly 3 unique and concise descriptions. Each description MUST be 90 characters or less. The descriptions should complement the headlines and encourage clicks.
    4.  **Output Format:** Provide the entire output as a single JSON object that strictly adheres to the provided schema. Do not include any explanatory text, markdown formatting, or anything else before or after the JSON object.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    description: "A list of ad groups.",
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Descriptive name for the ad group.",
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of keywords belonging to this ad group.",
        },
        headlines: {
          type: Type.ARRAY,
          items: { 
              type: Type.STRING,
              description: "A headline, 30 characters or less."
          },
          description: "List of generated ad headlines.",
        },
        descriptions: {
          type: Type.ARRAY,
          items: {
              type: Type.STRING,
              description: "A description, 90 characters or less."
          },
          description: "List of generated ad descriptions.",
        },
      },
      required: ["name", "keywords", "headlines", "descriptions"],
    },
  };

  // Try models in sequence with fallback
  const errors: Error[] = [];

  // Try Gemini 2.5 Pro first
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Trying Gemini 2.5 Pro...");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });
      
      return parseResponse(result.text);
    } catch (e) {
      console.error("Gemini 2.5 Pro failed:", e);
      errors.push(e as Error);
    }

    // Try Gemini 2.5 Flash as fallback
    try {
      console.log("Trying Gemini 2.5 Flash...");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });
      
      return parseResponse(result.text);
    } catch (e) {
      console.error("Gemini 2.5 Flash failed:", e);
      errors.push(e as Error);
    }
  }

  // Try OpenRouter 4o-mini as fallback
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("Trying OpenRouter 4o-mini...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-opus:4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert Google Ads campaign manager. You will output valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jsonText = data.choices[0].message.content;
      
      return parseResponse(jsonText);
    } catch (e) {
      console.error("OpenRouter 4o-mini failed:", e);
      errors.push(e as Error);
    }
  }

  // If all models failed, throw an error with details
  throw new Error(`All models failed. Last error: ${errors[errors.length - 1]?.message || "Unknown error"}`);
};

// Helper function to parse and validate the response
const parseResponse = (jsonText: string): AdGroup[] => {
  try {
    const parsedResult: any[] = JSON.parse(jsonText);
    
    // Validate and map the parsed result to our AdGroup type
    const adGroups: AdGroup[] = parsedResult.map((group, index) => {
      if (!group.name || !group.keywords || !group.headlines || !group.descriptions) {
        throw new Error(`Invalid structure for ad group at index ${index}`);
      }
      return {
        id: `${group.name.replace(/\s+/g, '-')}-${index}`,
        name: group.name,
        keywords: group.keywords,
        headlines: group.headlines.map((text: string) => ({ text, isPinned: false })),
        descriptions: group.descriptions.map((text: string) => ({ text })),
      }
    });

    return adGroups;
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", jsonText);
    throw new Error("The AI returned an invalid data format. Please try again.");
  }
};

export { generateAdGroupsAndCopy };
