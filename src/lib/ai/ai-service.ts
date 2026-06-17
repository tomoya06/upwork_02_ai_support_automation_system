import Groq from "groq-sdk";
import { config } from "@/lib/config";
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
  if (!_groq) _groq = new Groq({ apiKey: config.ai.groqApiKey });
  return _groq;
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
  const cleaned = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
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
}
