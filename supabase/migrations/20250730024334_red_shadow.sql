/*
  # Create Companies Table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to admins)
      - `name` (text)
      - `slug` (text, unique)
      - `logo_url` (text, optional)
      - `website` (text, optional)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `address` (jsonb, optional)
      - `settings` (jsonb)
      - `subscription_plan` (enum)
      - `subscription_expires_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for admin access to their companies
*/

-- Create enums
CREATE TYPE subscription_plan AS ENUM ('trial', 'basic', 'professional', 'enterprise');
CREATE TYPE company_status AS ENUM ('active', 'inactive', 'suspended', 'trial');

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  website text,
  phone text,
  email text,
  address jsonb,
  settings jsonb DEFAULT '{
    "messaging": {
      "whatsapp_enabled": false,
      "facebook_enabled": false,
      "viber_enabled": false,
      "auto_reply_enabled": false
    },
    "branding": {},
    "lead_scoring": {
      "source_weights": {
        "whatsapp": 8,
        "facebook": 6,
        "viber": 5,
        "website": 7,
        "referral": 9,
        "manual": 4
      },
      "activity_weights": {
        "call": 5,
        "message": 3,
        "email": 2,
        "meeting": 8,
        "site_visit": 10
      }
    },
    "notifications": {
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true
    }
  }'::jsonb,
  subscription_plan subscription_plan DEFAULT 'trial',
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status company_status DEFAULT 'trial'
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage their companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (admin_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON companies(admin_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan ON companies(subscription_plan);

-- Create updated_at trigger
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();