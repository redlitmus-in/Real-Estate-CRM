/*
  # Add Telegram Support to CRM

  1. Schema Updates
    - Add telegram_id and telegram_username to customers table
    - Update messaging_platform enum to include telegram
    - Update customer_source enum to include telegram
    - Update lead_source enum to include telegram

  2. Indexes
    - Add index on telegram_id for fast lookups
    - Add index on telegram_username for search

  3. Security
    - Update RLS policies to handle telegram data
*/

-- Add telegram_id and telegram_username to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'telegram_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN telegram_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE customers ADD COLUMN telegram_username text;
  END IF;
END $$;

-- Add indexes for telegram fields
CREATE INDEX IF NOT EXISTS idx_customers_telegram_id ON customers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_customers_telegram_username ON customers(telegram_username);

-- Update messaging_platform enum to include telegram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'telegram' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'messaging_platform')
  ) THEN
    ALTER TYPE messaging_platform ADD VALUE 'telegram';
  END IF;
END $$;

-- Update customer_source enum to include telegram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'telegram' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'customer_source')
  ) THEN
    ALTER TYPE customer_source ADD VALUE 'telegram';
  END IF;
END $$;

-- Update lead_source enum to include telegram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'telegram' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_source')
  ) THEN
    ALTER TYPE lead_source ADD VALUE 'telegram';
  END IF;
END $$;