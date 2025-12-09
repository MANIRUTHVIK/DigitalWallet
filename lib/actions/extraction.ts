"use server";

import { GoogleGenAI } from "@google/genai";
import { VITAL_TYPES } from "@/lib/constants";

interface ExtractedVital {
  vitalType: string;
  value: number;
  unit: string;
  confidence?: number;
}

interface ExtractionResult {
  success: boolean;
  vitals?: ExtractedVital[];
  summary?: string;
  error?: string;
}

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function extractVitalsFromReport(
  fileUrl: string,
  fileType: string
): Promise<ExtractionResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "[EXTRACTION] GEMINI_API_KEY not configured, skipping extraction"
      );
      return { success: true, vitals: [], summary: undefined };
    }

    // Fetch the file

    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(
        "[EXTRACTION] Failed to fetch file:",
        response.status,
        response.statusText
      );
      throw new Error("Failed to fetch report file");
    }

    const buffer = await response.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // Determine mime type
    const mimeType =
      fileType === "pdf"
        ? "application/pdf"
        : response.headers.get("content-type") || "image/jpeg";

    const prompt = `You are a medical report analyzer. Extract all vital signs from this health report.
Look for the following vitals:
- Blood Pressure (systolic/diastolic in mmHg)
- Heart Rate (in bpm)
- SpO2 (in %)
- Blood Sugar (in mg/dL)
- Hemoglobin (in g/dL)
- Cholesterol (total cholesterol in mg/dL)

Return ONLY a valid JSON array with this exact format:
[
  {
    "vitalType": "heart_rate",
    "value": 72,
    "unit": "bpm"
  }
]

Valid vitalType values are: blood_pressure, heart_rate, spo2, blood_sugar, hemoglobin, cholesterol
For blood pressure, store as a single decimal number like 120.80 (systolic.diastolic)

If no vitals are found, return an empty array: []
Do not include any explanation or markdown, only the JSON array.`;

    console.log("[EXTRACTION] Sending vitals extraction request to Gemini...");
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = (result.text || "").trim();
    console.log("[EXTRACTION] Raw vitals response:", text);

    let validVitals: ExtractedVital[] = [];

    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleanedText = text;
      if (text.startsWith("```json")) {
        cleanedText = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (text.startsWith("```")) {
        cleanedText = text.replace(/```\n?/g, "").trim();
      }

      // Parse the extracted vitals
      const extractedVitals: ExtractedVital[] = JSON.parse(cleanedText);

      // Validate and filter vitals
      validVitals = extractedVitals.filter((vital) => {
        const validTypes = Object.values(VITAL_TYPES);
        return (
          vital.vitalType &&
          validTypes.includes(vital.vitalType as any) &&
          vital.value &&
          !isNaN(vital.value) &&
          vital.value > 0 &&
          vital.unit
        );
      });
      console.log("[EXTRACTION] Valid vitals extracted:", validVitals);
    } catch (parseError) {
      console.error("[EXTRACTION] Failed to parse vitals:", parseError);
      console.log("[EXTRACTION] Continuing with empty vitals array");
    }

    // Generate summary of the report
    console.log("[EXTRACTION] Generating AI summary...");
    const summaryPrompt = `You are a medical report analyzer. Provide a concise 2-3 sentence summary of this health report.
Focus on:
- Key findings or diagnoses
- Notable vital signs or test results
- Any recommendations or concerns mentioned

Keep it brief, professional, and easy to understand for a patient.`;

    const summaryResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: summaryPrompt },
          ],
        },
      ],
    });

    const summary = (summaryResult.text || "").trim();
    console.log("[EXTRACTION] AI Summary generated:", summary);
    console.log("[EXTRACTION] Extraction complete. Returning results.");

    return { success: true, vitals: validVitals, summary };
  } catch (error) {
    console.error("[EXTRACTION] Error extracting vitals:");
    console.error("[EXTRACTION] Error details:", error);
    if (error instanceof Error) {
      console.error("[EXTRACTION] Error message:", error.message);
      console.error("[EXTRACTION] Error stack:", error.stack);
    }
    // Don't fail the upload if extraction fails, just return empty vitals
    return {
      success: true,
      vitals: [],
      summary: undefined,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
