-- Temporary ticket support: expiration and session-based isolation
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by_session text;

CREATE INDEX IF NOT EXISTS idx_tickets_expires_at ON tickets (expires_at);
CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets (created_by_session);
