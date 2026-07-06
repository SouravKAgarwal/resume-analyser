import "server-only";

import OpenAI from "openai";
import { z } from "zod";

/**
 * OpenAI-compatible client. Works with OpenAI, NVIDIA NIM, or any
 * compatible gateway — controlled by OPENAI_BASE_URL / OPENAI_MODEL.
 * nvapi-* keys default to NVIDIA's endpoint.
 */
const apiKey = process.env.OPENAI_API_KEY;

const baseURL = process.env.OPENAI_BASE_URL!;

export const AI_MODEL = process.env.OPENAI_MODEL!;

export const ai = new OpenAI({ apiKey, baseURL });

function extractJson(text: string): string {
  // Strip markdown fences and any prose around the JSON payload.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.search(/[[{]/);
  if (start === -1) return candidate;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(close);
  return end > start ? candidate.slice(start, end + 1) : candidate;
}

/**
 * Ask the model for JSON matching `schema`. Parses defensively and
 * retries once with the validation error appended before giving up.
 */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const { system, prompt, schema, temperature = 0.2, maxTokens = 8192 } = opts;

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${system}\n\nRespond with a single valid JSON object only — no markdown, no commentary.`,
      },
      { role: "user", content: prompt },
    ];
    if (attempt > 0) {
      messages.push({
        role: "user",
        content: `Your previous response was invalid: ${lastError}. Respond again with only the corrected JSON object.`,
      });
    }

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(extractJson(text));
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (e) {
      lastError = e instanceof Error ? e.message : "invalid JSON";
    }
  }
  throw new Error(`AI returned invalid JSON after retries: ${lastError}`);
}
