/*
  # User and Customer Management Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `email` (text, unique within company)
      - `name` (text)
      - `phone` (text, optional)
      - `role` (enum: admin, manager, agent, viewer)
      - `permissions` (text array)
      - `profile` (jsonb for additional data)
      - `last_login_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: active, inactive, suspended)

    - `customers`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `whatsapp_number` (text, optional)
      - `alternate_phone` (text, optional)
      - `source` (enum: manual, whatsapp, facebook, viber, website, referral, advertisement)
      - `lead_score` (integer, default 0)
      - `tags` (text array)
      - `notes` (text, optional)
      - `address` (jsonb, optional)
      - `preferences` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: active, inactive, blacklisted)

  2. Security
    - Enable RLS on both tables
    - Add policies for company-based data isolation
    - Users can only access data from their own company
    - Admins have full access to their companies' data

  3. Indexes
    - Add indexes for performance on frequently queried columns
    - Composite indexes for company_id + status queries
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE customer_source AS ENUM ('manual', 'whatsapp', 'facebook', 'viber', 'website', 'referral', 'advertisement');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blacklisted');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'agent',
  permissions text[] DEFAULT '{}',
  profile jsonb DEFAULT '{}',
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status user_status DEFAULT 'active',
  
  -- Ensure email is unique within each company
  UNIQUE(company_id, email)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  whatsapp_number text,
  alternate_phone text,
  source customer_source NOT NULL DEFAULT 'manual',
  lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  tags text[] DEFAULT '{}',
  notes text,
  address jsonb,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status customer_status DEFAULT 'active'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_status ON users(company_id, status);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_lead_score ON customers(lead_score);
CREATE INDEX IF NOT EXISTS idx_customers_company_status ON customers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own company data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company data"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create RLS policies for customers table
CREATE POLICY "Customers can read own company data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert own company data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own company data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Customers can delete own company data"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();