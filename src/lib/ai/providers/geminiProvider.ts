import { GoogleGenAI, Type, type Content, type Schema } from "@google/genai";
import { SYSTEM_PROMPT } from "../systemPrompt";
import { DIAGNOSIS_FIELDS, DIAGNOSIS_REQUIRED_FIELDS, parseDiagnosisResult } from "../replySchema";
import type { AIProvider, ChatTurn, DiagnosisResult } from "../provider";

// The only file in the codebase that imports @google/genai. Swapping AI vendors
// later means adding a sibling file here (implementing AIProvider) and switching
// AI_PROVIDER — nothing else in the app changes.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set — required for Dr. Hen's AI chat/vision features.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function toGeminiSchemaProperty(field: (typeof DIAGNOSIS_FIELDS)[keyof typeof DIAGNOSIS_FIELDS]): Schema {
  if (field.type === "boolean") {
    return { type: Type.BOOLEAN, description: field.description };
  }
  if ("enum" in field) {
    return { type: Type.STRING, format: "enum", enum: [...field.enum], description: field.description };
  }
  return { type: Type.STRING, description: field.description };
}

const DIAGNOSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: Object.fromEntries(
    Object.entries(DIAGNOSIS_FIELDS).map(([key, field]) => [key, toGeminiSchemaProperty(field)])
  ),
  required: [...DIAGNOSIS_REQUIRED_FIELDS],
};

function toGeminiContent(turn: ChatTurn): Content {
  const parts: Content["parts"] = [];
  if (turn.image) {
    parts!.push({ inlineData: { mimeType: turn.image.mimeType, data: turn.image.base64 } });
  }
  if (turn.text) {
    parts!.push({ text: turn.text });
  }
  return { role: turn.role === "assistant" ? "model" : "user", parts };
}

export const geminiProvider: AIProvider = {
  async runDiagnosis(turns: ChatTurn[]): Promise<DiagnosisResult> {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: turns.map(toGeminiContent),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: DIAGNOSIS_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned non-JSON output despite responseSchema: ${text.slice(0, 200)}`);
    }

    return parseDiagnosisResult(parsed);
  },
};
