-- Simple fix for duplicate leads
-- Run this in your Supabase SQL editor

-- Step 1: Show current duplicates
SELECT 
  customer_id,
  source,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM leads 
WHERE status = 'active'
GROUP BY customer_id, source
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicate leads (keeping the oldest one)
DELETE FROM leads 
WHERE id IN (
  SELECT l.id
  FROM leads l
  INNER JOIN (
    SELECT 
      customer_id,
      source,
      MIN(created_at) as first_created
    FROM leads 
    WHERE status = 'active'
    GROUP BY customer_id, source
    HAVING COUNT(*) > 1
  ) d ON l.customer_id = d.customer_id AND l.source = d.source
  WHERE l.created_at > d.first_created AND l.status = 'active'
);

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_customer_source_status 
ON leads (customer_id, source, status, created_at DESC);

-- Step 4: Show results
SELECT 
  'Duplicates cleaned up successfully' as result,
  COUNT(*) as remaining_leads
FROM leads 
WHERE status = 'active'; 