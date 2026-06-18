/**
 * Seed knowledge base with pre-written FAQ + docs (no LLM required).
 * Uses HuggingFace REST API directly (bypasses @hf/inference SDK to respect proxy).
 *
 * Usage:
 *   https_proxy=http://127.0.0.1:7890 ... npx tsx src/seed/seed-knowledge-static.ts
 */
import { createAdminClient } from "@/lib/supabase/admin";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY!;
const HF_MODEL = process.env.EMBEDDING_MODEL || "BAAI/bge-small-en-v1.5";
const PROXY = process.env.https_proxy || process.env.http_proxy;

async function generateEmbedding(text: string): Promise<number[]> {
  const agent = PROXY ? new HttpsProxyAgent(PROXY) : undefined;
  // Use router.huggingface.co which has better TLS compatibility
  const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text.replace(/\n+/g, " ").trim().slice(0, 512) }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent: agent as any,
  });
  if (!res.ok) throw new Error(`HF API error: ${res.status} ${await res.text()}`);
  const result = await res.json() as number[] | number[][];
  return Array.isArray(result[0]) ? (result as number[][])[0] : (result as number[]);
}

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const FAQS = [
  { q: "How do I update my billing information?", a: "Go to Settings → Billing → Edit Payment Method to update your credit card or billing details." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and bank transfers for annual plans." },
  { q: "How do I cancel my subscription?", a: "You can cancel anytime from Settings → Subscription → Cancel Plan. Your access continues until the end of the billing period." },
  { q: "Can I get a refund?", a: "We offer a 30-day money-back guarantee for new subscriptions. Contact support within 30 days of purchase." },
  { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page. You'll receive a reset link in your email within 5 minutes." },
  { q: "Why was I charged twice?", a: "Duplicate charges are rare and usually appear as pending. They typically resolve within 3-5 business days. Contact support with your transaction ID." },
  { q: "How do I upgrade my plan?", a: "Go to Settings → Subscription → Upgrade. Changes take effect immediately and you'll be charged the prorated difference." },
  { q: "What happens to my data if I cancel?", a: "Your data is retained for 90 days after cancellation. You can export it anytime during this period." },
  { q: "How do I add team members?", a: "Go to Settings → Team → Invite Members. Enter their email addresses and assign roles." },
  { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial with full access to all features. No credit card required." },
  { q: "How do I contact support?", a: "You can reach support via live chat, email at support@example.com, or by submitting a ticket in this portal." },
  { q: "What are your support hours?", a: "Support is available Monday–Friday 9am–6pm EST. Enterprise customers have 24/7 priority support." },
  { q: "How secure is my data?", a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC2 Type II certified." },
  { q: "Can I export my data?", a: "Yes. Go to Settings → Data → Export to download a full CSV/JSON export of your account data." },
  { q: "How do I enable two-factor authentication?", a: "Go to Settings → Security → Two-Factor Authentication and follow the setup wizard." },
  { q: "Why is my account suspended?", a: "Accounts are suspended for overdue payments or policy violations. Contact support to resolve the issue." },
  { q: "How do I change my email address?", a: "Go to Settings → Profile → Edit Email. A verification link will be sent to your new email." },
  { q: "What is your uptime guarantee?", a: "We guarantee 99.9% uptime SLA. Scheduled maintenance is announced 48 hours in advance." },
  { q: "How do I set up API access?", a: "Go to Settings → API → Generate Token. Include the token in the Authorization header of your requests." },
  { q: "Where can I find the API documentation?", a: "Full API documentation is available at docs.example.com/api. It includes endpoints, parameters, and code examples." },
];

const DOCS = [
  {
    title: "Billing & Payments Guide",
    content: `## Billing & Payments

### Invoice Cycle
Subscriptions are billed monthly or annually depending on your plan. Invoices are generated on the same day each month.

### Payment Failure
If a payment fails, we retry 3 times over 7 days. You'll receive email notifications at each attempt. 
After 3 failures, your account is temporarily suspended until payment is resolved.

### Prorations
When upgrading or downgrading, we calculate prorated charges based on the remaining days in your billing cycle.

### Tax
Applicable taxes are calculated automatically based on your billing address. EU customers must provide a valid VAT number to avoid tax charges.`,
  },
  {
    title: "Refund Policy",
    content: `## Refund Policy

### 30-Day Guarantee
All new subscriptions are eligible for a full refund within 30 days of the initial purchase.

### After 30 Days
After 30 days, refunds are granted at our discretion for extenuating circumstances such as:
- Extended service outages (>4 hours) not within our SLA
- Billing errors caused by our system
- Accidental duplicate subscriptions

### How to Request a Refund
1. Contact support at support@example.com
2. Include your account email and transaction ID
3. Describe the reason for your refund request
4. Allow 3-5 business days for processing

### Refund Method
Refunds are issued to the original payment method. Bank transfers may take 5-10 business days.`,
  },
  {
    title: "Account Setup Guide",
    content: `## Account Setup

### Creating Your Account
1. Sign up at app.example.com/signup
2. Verify your email address
3. Complete your profile setup
4. Choose a subscription plan

### Configuring Your Workspace
After signup, customize your workspace:
- Upload your company logo
- Set your timezone and language
- Configure notification preferences
- Invite team members

### Roles & Permissions
- **Owner**: Full access, billing management
- **Admin**: User management, settings access
- **Member**: Standard feature access
- **Viewer**: Read-only access

### Single Sign-On (SSO)
Enterprise plans support SAML 2.0 SSO with providers like Okta, Azure AD, and Google Workspace.`,
  },
];

async function seedFAQs(supabase: ReturnType<typeof createAdminClient>) {
  console.log("Seeding FAQ chunks...");
  const { data: doc, error } = await supabase
    .from("knowledge_documents")
    .insert({ workspace_id: WORKSPACE_ID, title: "FAQ - Common Questions", status: "active" })
    .select("id")
    .single();

  if (error || !doc) throw new Error(`Failed to create FAQ document: ${error?.message}`);

  let count = 0;
  for (const faq of FAQS) {
    const content = `Q: ${faq.q}\nA: ${faq.a}`;
    try {
      const embedding = await generateEmbedding(content);
      await supabase.from("knowledge_chunks").insert({
        document_id: doc.id,
        content,
        embedding,
        metadata: { type: "faq", question: faq.q },
      });
      count++;
      process.stdout.write(`  ✓ FAQ ${count}/${FAQS.length}\r`);
    } catch (e) {
      console.error(`  Failed FAQ: ${faq.q}`, e);
    }
  }
  console.log(`\nSeeded ${count} FAQ chunks.`);
}

async function seedDocs(supabase: ReturnType<typeof createAdminClient>) {
  console.log("Seeding documentation chunks...");
  let total = 0;
  for (const doc of DOCS) {
    const { data: docRecord, error } = await supabase
      .from("knowledge_documents")
      .insert({ workspace_id: WORKSPACE_ID, title: doc.title, status: "active" })
      .select("id")
      .single();

    if (error || !docRecord) { console.error(`Failed to create doc: ${doc.title}`); continue; }

    // Split into paragraphs
    const chunks = doc.content.split(/\n\n+/).filter((c) => c.trim().length > 20);
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk);
        await supabase.from("knowledge_chunks").insert({
          document_id: docRecord.id,
          content: chunk,
          embedding,
          metadata: { type: "documentation", title: doc.title },
        });
        total++;
      } catch (e) {
        console.error(`  Failed chunk in ${doc.title}:`, e);
      }
    }
    console.log(`  ✓ ${doc.title}: ${chunks.length} chunks`);
  }
  console.log(`Seeded ${total} documentation chunks total.`);
}

async function main() {
  const supabase = createAdminClient();
  await seedFAQs(supabase);
  await seedDocs(supabase);
  console.log("\nKnowledge base seeded successfully!");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
