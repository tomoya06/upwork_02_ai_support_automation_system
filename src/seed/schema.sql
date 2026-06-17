-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Workspaces (multi-tenant placeholder)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  auto_resolve_threshold FLOAT DEFAULT 0.85,
  escalation_threshold FLOAT DEFAULT 0.4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  tier TEXT CHECK (tier IN ('free', 'pro', 'enterprise')),
  lifetime_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'escalated', 'closed')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('billing', 'technical', 'account', 'refund', 'feature_request', 'general')),
  source TEXT DEFAULT 'web',
  assigned_to UUID,
  ai_confidence FLOAT,
  suggested_action TEXT,
  last_ai_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'ai', 'agent', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket classifications (audit trail)
CREATE TABLE IF NOT EXISTS ticket_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  category TEXT,
  priority TEXT,
  sentiment TEXT CHECK (sentiment IN ('negative', 'neutral', 'positive')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
  confidence FLOAT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI decisions
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  suggested_action TEXT,
  reasoning TEXT,
  confidence FLOAT,
  requires_approval BOOLEAN DEFAULT TRUE,
  executed_at TIMESTAMPTZ,
  executed_by UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_executed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge chunks (vectorized)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(384),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Similar tickets cache
CREATE TABLE IF NOT EXISTS similar_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  similar_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, similar_ticket_id)
);

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_category TEXT,
  trigger_priority TEXT,
  action TEXT NOT NULL CHECK (action IN ('auto_reply', 'auto_resolve', 'escalate')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics daily aggregation
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_tickets INTEGER DEFAULT 0,
  ai_resolved INTEGER DEFAULT 0,
  escalated INTEGER DEFAULT 0,
  avg_first_response_sec INTEGER,
  avg_resolution_sec INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, date)
);

-- Pipeline runs (decision trace)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_workspace_status ON tickets(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classifications_ticket ON ticket_classifications(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_ticket ON decisions(ticket_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_similar_tickets_ticket ON similar_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_ticket ON pipeline_runs(ticket_id, created_at DESC);

-- Vector search index
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- Vector similarity RPC functions
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT,
  p_workspace_id UUID
)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.workspace_id = p_workspace_id
    AND kd.status = 'active'
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_similar_tickets(
  query_embedding VECTOR(384),
  target_ticket_id UUID,
  p_workspace_id UUID,
  match_count INT
)
RETURNS TABLE(
  id UUID,
  subject TEXT,
  body TEXT,
  status TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    t.id,
    t.subject,
    t.body,
    t.status,
    1 - (tc.embedding <=> query_embedding) AS similarity
  FROM (
    SELECT kc.id, kc.embedding, kc.metadata
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kd.id = kc.document_id
    WHERE kd.workspace_id = p_workspace_id
      AND kd.title = 'ticket_embeddings'
      AND kc.metadata->>'ticket_id' != target_ticket_id::text
  ) tc
  JOIN tickets t ON t.id = (tc.metadata->>'ticket_id')::UUID
  WHERE t.workspace_id = p_workspace_id
    AND t.status = 'resolved'
    AND 1 - (tc.embedding <=> query_embedding) > 0.7
  ORDER BY tc.embedding <=> query_embedding
  LIMIT match_count;
$$;
