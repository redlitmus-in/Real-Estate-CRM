/*
  # Insert Sample Data

  1. Sample Data
    - Insert sample admin
    - Insert sample companies
    - Insert sample users
    - Insert sample customers
    - Insert sample properties
    - Insert sample leads

  2. Notes
    - This is for development and testing purposes
    - Real production data should be created through the application
*/

-- Insert sample admin
INSERT INTO admins (id, email, name, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@propconnect.com', 'System Administrator', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (id, admin_id, name, slug, email, phone, website, address, subscription_plan, status) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'ABC Realty',
  'abc-realty',
  'info@abcrealty.com',
  '+91 98765 43210',
  'https://abcrealty.com',
  '{"street": "123 Business District", "city": "Bangalore", "state": "Karnataka", "country": "India", "postal_code": "560001"}'::jsonb,
  'professional',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'XYZ Properties',
  'xyz-properties',
  'contact@xyzproperties.com',
  '+91 87654 32109',
  'https://xyzproperties.com',
  '{"street": "456 Commercial Hub", "city": "Mumbai", "state": "Maharashtra", "country": "India", "postal_code": "400001"}'::jsonb,
  'basic',
  'trial'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, company_id, email, name, phone, role, permissions, status) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440001',
  'agent@realestate.com',
  'John Doe',
  '+91 98765 43211',
  'agent',
  ARRAY['customers:read', 'customers:write', 'leads:read', 'leads:write', 'properties:read', 'messages:read', 'messages:write'],
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440001',
  'manager@abcrealty.com',
  'Jane Smith',
  '+91 98765 43212',
  'manager',
  ARRAY['users:read', 'users:write', 'customers:read', 'customers:write', 'leads:read', 'leads:write', 'properties:read', 'properties:write', 'messages:read', 'messages:write', 'analytics:read'],
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, company_id, name, phone, email, whatsapp_number, source, lead_score, tags, notes, address, status) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440001',
  'Rajesh Kumar',
  '+91 98765 43210',
  'rajesh@example.com',
  '+91 98765 43210',
  'whatsapp',
  85,
  ARRAY['hot-lead', 'apartment-buyer'],
  'Interested in 2BHK apartment in Whitefield',
  '{"city": "Bangalore", "state": "Karnataka", "country": "India"}'::jsonb,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440001',
  'Priya Sharma',
  '+91 87654 32109',
  'priya@example.com',
  '+91 87654 32109',
  'facebook',
  72,
  ARRAY['villa-buyer', 'premium'],
  'Looking for villa in Electronic City',
  '{"city": "Bangalore", "state": "Karnataka", "country": "India"}'::jsonb,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440001',
  'Amit Patel',
  '+91 76543 21098',
  'amit@example.com',
  '+91 76543 21098',
  'website',
  68,
  ARRAY['commercial-buyer'],
  'Interested in commercial plot',
  '{"city": "Bangalore", "state": "Karnataka", "country": "India"}'::jsonb,
  'active'
)
ON CONFLICT DO NOTHING;

-- Insert sample properties
INSERT INTO properties (id, company_id, title, description, type, bhk_type, area_sqft, price_min, price_max, location, amenities, rera_number, status) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440001',
  'Luxury 2BHK Apartment in Whitefield',
  'Premium apartment with modern amenities in the heart of Whitefield',
  'apartment',
  '2BHK',
  1200,
  4500000,
  5500000,
  '{"address": {"street": "Whitefield Main Road", "city": "Bangalore", "state": "Karnataka", "country": "India"}, "locality": "Whitefield", "nearby_facilities": ["Metro", "Mall", "Hospital"]}'::jsonb,
  ARRAY['Swimming Pool', 'Gym', 'Parking', 'Security', 'Power Backup'],
  'PRM/KA/RERA/1251/446/AG/010203/000482',
  'available'
),
(
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440001',
  'Independent Villa in Electronic City',
  'Spacious 3BHK villa with garden and parking',
  'villa',
  '3BHK',
  2500,
  8500000,
  9500000,
  '{"address": {"street": "Electronic City Phase 1", "city": "Bangalore", "state": "Karnataka", "country": "India"}, "locality": "Electronic City", "nearby_facilities": ["IT Parks", "Schools", "Shopping"]}'::jsonb,
  ARRAY['Garden', 'Parking', 'Security', 'Power Backup', 'Water Supply'],
  'PRM/KA/RERA/1251/446/AG/010203/000483',
  'available'
)
ON CONFLICT DO NOTHING;

-- Insert sample leads
INSERT INTO leads (id, company_id, customer_id, property_id, assigned_to, source, stage, score, budget_min, budget_max, requirements, notes, next_follow_up, status) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440040',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440010',
  'whatsapp',
  'qualified',
  85,
  4000000,
  5500000,
  '{"property_type": "apartment", "bhk": "2BHK", "location": "Whitefield", "budget": "45-55L"}'::jsonb,
  'Very interested, ready to visit this weekend',
  now() + interval '2 days',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440041',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440010',
  'facebook',
  'contacted',
  72,
  8000000,
  10000000,
  '{"property_type": "villa", "bhk": "3BHK", "location": "Electronic City", "budget": "80L-1Cr"}'::jsonb,
  'Needs to discuss with family',
  now() + interval '3 days',
  'active'
)
ON CONFLICT DO NOTHING;