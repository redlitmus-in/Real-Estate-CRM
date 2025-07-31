// Neo4j Schema for Real Estate CRM
// Run these commands in Neo4j Browser or AuraDB Console

// Create indexes for performance
CREATE INDEX customer_id IF NOT EXISTS FOR (c:Customer) ON (c.id);
CREATE INDEX property_type IF NOT EXISTS FOR (p:Property) ON (p.type);
CREATE INDEX session_id IF NOT EXISTS FOR (s:Session) ON (s.id);
CREATE INDEX message_timestamp IF NOT EXISTS FOR (m:Message) ON (m.timestamp);

// Create constraints for data integrity
CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT property_id_unique IF NOT EXISTS FOR (p:Property) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE;

// Create sample data for testing

// Sample Customers
CREATE (c1:Customer {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "John Doe",
  email: "john@example.com",
  phone: "+91 98765 43210",
  source: "telegram",
  lead_score: 75,
  preferences: "{\"property_type\": \"apartment\", \"budget\": 5000000}",
  created_at: datetime()
});

CREATE (c2:Customer {
  id: "550e8400-e29b-41d4-a716-446655440002",
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "+91 98765 43211",
  source: "whatsapp",
  lead_score: 85,
  preferences: "{\"property_type\": \"villa\", \"budget\": 15000000}",
  created_at: datetime()
});

// Sample Properties
CREATE (p1:Property {
  id: "prop-001",
  title: "Luxury 2BHK Apartment",
  type: "apartment",
  bhk_type: "2BHK",
  price_min: 4500000,
  price_max: 5500000,
  area_sqft: 1200,
  location: "Whitefield, Bangalore",
  amenities: ["Swimming Pool", "Gym", "Parking"],
  status: "available",
  created_at: datetime()
});

CREATE (p2:Property {
  id: "prop-002",
  title: "Premium 3BHK Villa",
  type: "villa",
  bhk_type: "3BHK",
  price_min: 12000000,
  price_max: 15000000,
  area_sqft: 2500,
  location: "Sarjapur, Bangalore",
  amenities: ["Garden", "Security", "Parking"],
  status: "available",
  created_at: datetime()
});

CREATE (p3:Property {
  id: "prop-003",
  title: "Modern 1BHK Apartment",
  type: "apartment",
  bhk_type: "1BHK",
  price_min: 2500000,
  price_max: 3000000,
  area_sqft: 800,
  location: "Electronic City, Bangalore",
  amenities: ["Lift", "Security", "Parking"],
  status: "available",
  created_at: datetime()
});

// Sample Sessions
CREATE (s1:Session {
  id: "session-001",
  platform: "real_estate_crm",
  created_at: datetime()
});

CREATE (s2:Session {
  id: "session-002",
  platform: "real_estate_crm",
  created_at: datetime()
});

// Create relationships
MATCH (c1:Customer {id: "550e8400-e29b-41d4-a716-446655440001"})
MATCH (s1:Session {id: "session-001"})
CREATE (c1)-[:HAS_SESSION]->(s1);

MATCH (c2:Customer {id: "550e8400-e29b-41d4-a716-446655440002"})
MATCH (s2:Session {id: "session-002"})
CREATE (c2)-[:HAS_SESSION]->(s2);

// Sample Messages
CREATE (m1:Message {
  content: "Hi, I'm looking for a 2BHK apartment in Whitefield",
  role: "user",
  timestamp: datetime()
});

CREATE (m2:Message {
  content: "Hello! I can help you find the perfect 2BHK apartment in Whitefield. What's your budget range?",
  role: "assistant",
  timestamp: datetime()
});

// Connect messages to sessions
MATCH (s1:Session {id: "session-001"})
MATCH (m1:Message {content: "Hi, I'm looking for a 2BHK apartment in Whitefield"})
CREATE (s1)-[:HAS_MESSAGE]->(m1);

MATCH (s1:Session {id: "session-001"})
MATCH (m2:Message {content: "Hello! I can help you find the perfect 2BHK apartment in Whitefield. What's your budget range?"})
CREATE (s1)-[:HAS_MESSAGE]->(m2);

// Create property similarity relationships
MATCH (p1:Property {id: "prop-001"})
MATCH (p3:Property {id: "prop-003"})
CREATE (p1)-[:SIMILAR_TO]->(p3);

MATCH (p2:Property {id: "prop-002"})
MATCH (p1:Property {id: "prop-001"})
CREATE (p2)-[:SIMILAR_TO]->(p1);

// Create customer-property viewing relationships
MATCH (c1:Customer {id: "550e8400-e29b-41d4-a716-446655440001"})
MATCH (p1:Property {id: "prop-001"})
CREATE (c1)-[:VIEWED]->(p1);

MATCH (c2:Customer {id: "550e8400-e29b-41d4-a716-446655440002"})
MATCH (p2:Property {id: "prop-002"})
CREATE (c2)-[:VIEWED]->(p2);

// Verify the data
MATCH (c:Customer) RETURN c;
MATCH (p:Property) RETURN p;
MATCH (s:Session) RETURN s;
MATCH (m:Message) RETURN m; 