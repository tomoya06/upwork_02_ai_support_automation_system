-- Rate limiting table for tracking API request timestamps
-- Used for QPS limiting: anonymous global 5 QPS, admin guaranteed 1 QPS

CREATE TABLE IF NOT EXISTS rate_limits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL DEFAULT 'anonymous_global',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast time-range queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_created 
ON rate_limits (bucket, created_at);

-- Optional: schedule cleanup every minute (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '1 minute', 
--   $$DELETE FROM rate_limits WHERE created_at < now() - interval '10 seconds'$$);
