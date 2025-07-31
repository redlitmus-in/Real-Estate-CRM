/*
  # Create Properties Table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `title` (text)
      - `description` (text, optional)
      - `type` (enum: apartment, villa, plot, commercial, warehouse, office)
      - `sub_type` (text, optional)
      - `bhk_type` (enum: 1RK, 1BHK, 2BHK, 3BHK, 4BHK, 5BHK+)
      - `area_sqft` (numeric, optional)
      - `area_sqmt` (numeric, optional)
      - `price_min` (numeric, optional)
      - `price_max` (numeric, optional)
      - `price_per_sqft` (numeric, optional)
      - `location` (jsonb)
      - `amenities` (text array)
      - `images` (text array)
      - `documents` (text array)
      - `rera_number` (text, optional)
      - `possession_date` (date, optional)
      - `floor_details` (jsonb, optional)
      - `parking_details` (jsonb, optional)
      - `specifications` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (enum: available, sold, rented, under_construction, inactive)

  2. Security
    - Enable RLS on `properties` table
    - Add policies for company-based access
*/

-- Create enums
CREATE TYPE property_type AS ENUM ('apartment', 'villa', 'plot', 'commercial', 'warehouse', 'office');
CREATE TYPE bhk_type AS ENUM ('1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+');
CREATE TYPE property_status AS ENUM ('available', 'sold', 'rented', 'under_construction', 'inactive');

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type property_type NOT NULL,
  sub_type text,
  bhk_type bhk_type,
  area_sqft numeric,
  area_sqmt numeric,
  price_min numeric,
  price_max numeric,
  price_per_sqft numeric,
  location jsonb DEFAULT '{}'::jsonb,
  amenities text[] DEFAULT ARRAY[]::text[],
  images text[] DEFAULT ARRAY[]::text[],
  documents text[] DEFAULT ARRAY[]::text[],
  rera_number text,
  possession_date date,
  floor_details jsonb,
  parking_details jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status property_status DEFAULT 'available'
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage properties in their company"
  ON properties
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_bhk_type ON properties(bhk_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price_min ON properties(price_min);
CREATE INDEX IF NOT EXISTS idx_properties_price_max ON properties(price_max);
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN(amenities);

-- Create updated_at trigger
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();