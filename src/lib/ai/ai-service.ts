import Groq from "groq-sdk";
import { config } from "@/lib/config";
import { fetchWithProxy } from "@/lib/fetch-with-proxy";
import {
  classificationPrompt,
  decisionPrompt,
  replyPrompt,
} from "./prompt-templates";
import { parseClassification, parseDecision, parseReply } from "./schemas";
import type {
  ClassificationResult,
  DecisionResult,
  ReplyResult,
} from "@/types";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: config.ai.groqApiKey, fetch: fetchWithProxy });
  return _groq;
}

function extractFirstJSON(content: string): string {
  const cleaned = content.replace(/```json|```/g, "").trim();

  // Fast path: the whole content is valid JSON.
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // fall through
  }

  // Some models append explanatory text after the JSON object.
  // Scan for the first balanced JSON object/array.
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);

  if (start === -1) {
    throw new Error("No JSON object or array found in model response");
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{" || ch === "[") {
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error("Unterminated JSON object/array in model response");
  }

  return cleaned.slice(start, end + 1);
}

async function callGroqJSON(system: string, user: string): Promise<unknown> {
  const groq = getGroq();
  const response = await groq.chat.completions.create({
    model: config.ai.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content || "";
  return JSON.parse(extractFirstJSON(content));
}

export async function generateText(prompt: string): Promise<string> {
  const groq = getGroq();
  const response = await groq.chat.completions.create({
    model: config.ai.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return response.choices[0]?.message?.content || "";
}

export async function classifyTicket(
  subject: string,
  body: string
): Promise<ClassificationResult> {
  const data = await callGroqJSON(
    "You are a customer support ticket classifier. Always return valid JSON.",
    classificationPrompt(subject, body)
  );
  return parseClassification(data);
}

export async function makeDecisionWithLLM(
  subject: string,
  body: string,
  classification: ClassificationResult,
  context: string,
  customerTier: string,
  lifetimeValue: number
): Promise<DecisionResult> {
  const data = await callGroqJSON(
    "You are an AI decision engine for customer support. Always return valid JSON.",
    decisionPrompt(
      subject,
      body,
      JSON.stringify(classification),
      context,
      customerTier,
      lifetimeValue
    )
  );
  return parseDecision(data);
}

export async function generateReply(
  subject: string,
  body: string,
  classification: ClassificationResult,
  decision: DecisionResult,
  context: string,
  style: "full" | "short" | "detailed" | "next-step" = "full"
): Promise<ReplyResult> {
  try {
    const data = await callGroqJSON(
      "You are a helpful customer support agent. Always return valid JSON.",
      replyPrompt(
        subject,
        body,
        JSON.stringify(classification),
        JSON.stringify(decision),
        context,
        style
      )
    );
    return parseReply(data);
  } catch (error) {
    // LLM sometimes returns malformed JSON. Fall back to a generic draft reply
    // so the pipeline can still complete and a human agent can refine it.
    console.error("Failed to generate structured AI reply, using fallback", error);
    return {
      reply: "Thank you for reaching out. We're reviewing your request and will respond with a solution shortly.",
      citations: [],
    };
  }
}
