-- Create sales table and populate with 1 million rows (~100 MB CSV output)
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  amount NUMERIC,
  created_at TIMESTAMPTZ
);

-- Only seed if table is empty
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM sales) = 0 THEN
    INSERT INTO sales(amount, created_at)
    SELECT round((random()*1000)::numeric, 2),
           NOW() - (random()*'365 days'::interval)
    FROM generate_series(1, 1000000);
  END IF;
END$$;
