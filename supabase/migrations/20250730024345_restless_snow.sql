/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `email` (text, unique)
      - `name` (text)
      - `phone` (text, optional)
      - `role` (enum: admin, manager, agent, viewer)
      - `permissions` (text array)
      - `profile` (jsonb)
      - `last_login_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: active, inactive, suspended)

  2. Security
    - Enable RLS on `users` table
    - Add policies for company-based access
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role user_role DEFAULT 'agent',
  permissions text[] DEFAULT ARRAY[]::text[],
  profile jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status user_status DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read users in their company"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage users in their company"
  ON users
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();