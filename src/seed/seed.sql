-- Seed initial workspace
INSERT INTO workspaces (id, name, auto_resolve_threshold, escalation_threshold)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Workspace',
  0.85,
  0.4
)
ON CONFLICT (id) DO NOTHING;

-- Seed demo customers
INSERT INTO customers (id, workspace_id, email, name, tier, lifetime_value) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice Johnson', 'pro', 1200),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'bob@enterprise.com', 'Bob Smith', 'enterprise', 15000),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'carol@free.com', 'Carol White', 'free', 0)
ON CONFLICT (id) DO NOTHING;

-- Seed automation rules
INSERT INTO automation_rules (workspace_id, name, trigger_category, trigger_priority, action) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Auto-resolve low confidence general', 'general', 'low', 'auto_resolve'),
  ('00000000-0000-0000-0000-000000000001', 'Escalate critical technical', 'technical', 'critical', 'escalate')
ON CONFLICT DO NOTHING;

-- Seed demo knowledge documents
INSERT INTO knowledge_documents (id, workspace_id, title, source_url, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Billing FAQ', NULL, 'active'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Refund Policy', NULL, 'active'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Account Setup Guide', NULL, 'active')
ON CONFLICT (id) DO NOTHING;
