export const classificationPrompt = (subject: string, body: string): string =>
  `You are an expert customer support ticket classifier.
Analyze the following support ticket and return a JSON object with these fields:
- category: one of [billing, technical, account, refund, feature_request, general]
- priority: one of [low, medium, high, critical]
- sentiment: one of [negative, neutral, positive]
- urgency: one of [low, medium, high]
- confidence: number between 0 and 1
- reasoning: brief explanation

Ticket:
Subject: ${subject}
Body: ${body}

Return ONLY valid JSON, no markdown.`;

export const decisionPrompt = (
  subject: string,
  body: string,
  classification: string,
  context: string,
  customerTier: string,
  lifetimeValue: number
): string =>
  `You are an AI decision engine for a customer support system.
Based on the ticket, classification, retrieved context, and customer profile, decide the best action.

Ticket:
Subject: ${subject}
Body: ${body}

Classification: ${classification}

Customer Profile:
- Tier: ${customerTier}
- Lifetime Value: $${lifetimeValue}

Retrieved Context:
${context}

Return a JSON object with:
- suggested_action: a concise action like "reply_with_solution", "escalate_to_billing", "refund_review", "auto_resolve"
- auto_resolve: boolean (only true if confidence is very high and no human approval needed)
- requires_approval: boolean (true for refund, billing changes, escalations)
- route_to: team name or null
- confidence: number between 0 and 1
- reasoning: brief explanation

Return ONLY valid JSON, no markdown.`;

export const replyPrompt = (
  subject: string,
  body: string,
  classification: string,
  decision: string,
  context: string,
  style: string
): string =>
  `You are a helpful customer support agent.
Generate a ${style} response to the following ticket.

Ticket:
Subject: ${subject}
Body: ${body}

Classification: ${classification}

Decision: ${decision}

Retrieved Context:
${context}

Style guidelines:
- "short": 1-2 sentences
- "full": complete but concise support response
- "detailed": thorough explanation
- "next-step": focus on what the customer should do next

Return a JSON object with:
- reply: the response text
- citations: array of source identifiers mentioned (e.g., ["doc_123", "ticket_456"])

Return ONLY valid JSON, no markdown.`;

export const knowledgeGenerationPrompt = (topic: string): string =>
  `You are a SaaS customer support knowledge base writer.
Write a concise knowledge base article about: ${topic}
Use Markdown formatting. Keep it under 400 words.`;
