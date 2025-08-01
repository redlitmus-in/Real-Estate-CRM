-- Fix duplicate leads issue
-- Run this script to clean up existing duplicates and prevent future ones

-- Step 1: Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_leads AS
SELECT 
  customer_id,
  company_id,
  source,
  stage,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM leads 
WHERE status = 'active'
GROUP BY customer_id, company_id, source, stage
HAVING COUNT(*) > 1;

-- Step 2: Show duplicates before deletion
SELECT 
  'Found duplicates:' as info,
  customer_id,
  source,
  duplicate_count
FROM duplicate_leads;

-- Step 3: Delete duplicate leads, keeping only the first one for each customer
DELETE FROM leads 
WHERE id IN (
  SELECT l.id
  FROM leads l
  INNER JOIN duplicate_leads d ON 
    l.customer_id = d.customer_id AND
    l.company_id = d.company_id AND
    l.source = d.source AND
    l.stage = d.stage AND
    l.status = 'active'
  WHERE l.created_at > d.first_created
);

-- Step 4: Add a unique constraint to prevent future duplicates
-- This ensures only one active lead per customer per source
-- Using a more compatible approach without WHERE clause
ALTER TABLE leads 
ADD CONSTRAINT unique_active_lead_per_customer 
UNIQUE (customer_id, source, status);

-- Step 5: Add an index for better performance on lead queries
CREATE INDEX IF NOT EXISTS idx_leads_customer_status 
ON leads (customer_id, status, created_at DESC);

-- Step 6: Add a trigger to prevent duplicate leads at the database level
CREATE OR REPLACE FUNCTION prevent_duplicate_leads()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already an active lead for this customer and source
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM leads 
    WHERE customer_id = NEW.customer_id 
    AND source = NEW.source 
    AND status = 'active'
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate lead detected for customer % and source %', NEW.customer_id, NEW.source;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_leads ON leads;
CREATE TRIGGER trigger_prevent_duplicate_leads
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_leads();

-- Step 7: Show results
SELECT 
  'Duplicates cleaned up successfully' as result,
  COUNT(*) as remaining_leads
FROM leads 
WHERE status = 'active'; 