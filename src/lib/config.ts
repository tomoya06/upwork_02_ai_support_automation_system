export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY!,
    model: process.env.GROQ_MODEL || "llama3-8b-8192",
  },
  embeddings: {
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY!,
    model: process.env.EMBEDDING_MODEL || "BAAI/bge-small-en-v1.5",
    dimension: 384,
  },
  features: {
    autoResolve: process.env.ENABLE_AUTO_RESOLVE === "true",
    autoEscalate: process.env.ENABLE_AUTO_ESCALATE === "true",
    logAiCalls: process.env.LOG_AI_CALLS === "true",
  },
  workspace: {
    defaultAutoResolveThreshold: 0.85,
    defaultEscalationThreshold: 0.4,
  },
};
