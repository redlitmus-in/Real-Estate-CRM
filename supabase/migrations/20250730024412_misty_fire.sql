/*
  # Create Leads Table

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `customer_id` (uuid, foreign key to customers)
      - `property_id` (uuid, foreign key to properties, optional)
      - `assigned_to` (uuid, foreign key to users, optional)
      - `source` (enum)
      - `stage` (enum: new, contacted, qualified, proposal, negotiation, closed_won, closed_lost)
      - `score` (integer, 0-100)
      - `budget_min` (numeric, optional)
      - `budget_max` (numeric, optional)
      - `requirements` (jsonb)
      - `notes` (text, optional)
      - `next_follow_up` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: active, inactive, archived)

  2. Security
    - Enable RLS on `leads` table
    - Add policies for company-based access
*/

-- Create enums
CREATE TYPE lead_source AS ENUM ('whatsapp', 'facebook', 'viber', 'manual', 'website', 'referral');
CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE lead_status AS ENUM ('active', 'inactive', 'archived');

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  source lead_source DEFAULT 'manual',
  stage lead_stage DEFAULT 'new',
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  budget_min numeric,
  budget_max numeric,
  requirements jsonb DEFAULT '{}'::jsonb,
  notes text,
  next_follow_up timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status lead_status DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage leads in their company"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up);

-- Create updated_at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();