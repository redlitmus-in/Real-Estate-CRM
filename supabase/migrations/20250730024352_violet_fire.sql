/*
  # Create Customers Table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `whatsapp_number` (text, optional)
      - `alternate_phone` (text, optional)
      - `source` (enum)
      - `lead_score` (integer, default 0)
      - `tags` (text array)
      - `notes` (text, optional)
      - `address` (jsonb, optional)
      - `preferences` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: active, inactive, blacklisted)

  2. Security
    - Enable RLS on `customers` table
    - Add policies for company-based access
*/

-- Create enums
CREATE TYPE customer_source AS ENUM ('manual', 'whatsapp', 'facebook', 'viber', 'website', 'referral', 'advertisement');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blacklisted');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  whatsapp_number text,
  alternate_phone text,
  source customer_source DEFAULT 'manual',
  lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  address jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status customer_status DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage customers in their company"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_lead_score ON customers(lead_score);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);

-- Create updated_at trigger
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();