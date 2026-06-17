/**
 * Generate FAQ / product documentation with an LLM and seed them into the
 * knowledge base. After generation, embeddings are computed and stored.
 *
 * Usage:
 *   export GROQ_API_KEY=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   export HUGGINGFACE_API_KEY=...
 *   npx tsx src/seed/seed-knowledge.ts
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/ai/embedding-service";
import { generateText } from "@/lib/ai/ai-service";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const FAQ_PROMPT = `You are a SaaS customer support knowledge base writer.
Generate a JSON array of 20 common FAQ entries for a generic B2B SaaS product.
Each entry must have "question" and "answer" fields.
Categories should include billing, refunds, account management, technical issues, and feature requests.
Return ONLY valid JSON.`;

const DOCS_PROMPT = `You are a technical writer for a B2B SaaS product.
Generate concise documentation sections in Markdown for the following topics:
- Billing and Payments
- Refund Policy
- Account Setup
- Password Reset
- API Rate Limits
Return ONLY the Markdown content.`;

function chunkText(text: string, maxLength = 800): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of text.split(/\n\n+/)) {
    if ((current + paragraph).length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current += "\n\n" + paragraph;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function seedFAQ(supabase: ReturnType<typeof createAdminClient>) {
  const { data: doc } = await supabase
    .from("knowledge_documents")
    .insert({ workspace_id: WORKSPACE_ID, title: "AI Generated FAQ", status: "active" })
    .select("id")
    .single();

  if (!doc) throw new Error("Failed to create FAQ document");

  const result = await generateText(FAQ_PROMPT);
  const faqs = JSON.parse(result) as { question: string; answer: string }[];

  for (const faq of faqs) {
    const content = `Q: ${faq.question}\nA: ${faq.answer}`;
    const embedding = await generateEmbedding(content);

    await supabase.from("knowledge_chunks").insert({
      document_id: doc.id,
      content,
      embedding,
      metadata: { type: "faq", question: faq.question },
    });
  }

  console.log(`Seeded ${faqs.length} FAQ chunks.`);
}

async function seedDocs(supabase: ReturnType<typeof createAdminClient>) {
  const { data: doc } = await supabase
    .from("knowledge_documents")
    .insert({ workspace_id: WORKSPACE_ID, title: "AI Generated Product Docs", status: "active" })
    .select("id")
    .single();

  if (!doc) throw new Error("Failed to create docs document");

  const docs = await generateText(DOCS_PROMPT);
  const chunks = chunkText(docs);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    await supabase.from("knowledge_chunks").insert({
      document_id: doc.id,
      content: chunk,
      embedding,
      metadata: { type: "documentation" },
    });
  }

  console.log(`Seeded ${chunks.length} documentation chunks.`);
}

async function main() {
  const supabase = createAdminClient();
  await seedFAQ(supabase);
  await seedDocs(supabase);
  console.log("Knowledge base seeded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
