import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jConnection {
  private driver: Driver | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      const uri = import.meta.env.VITE_NEO4J_URL;
      const username = import.meta.env.VITE_NEO4J_USER || 'neo4j';
      const password = import.meta.env.VITE_NEO4J_PASSWORD;

      // Check if environment variables are configured
      if (!uri || !password) {
        console.error('❌ Neo4j: Missing environment variables');
        this.isConnected = false;
        return;
      }

      // Validate URI format
      if (!uri.includes('neo4j+s://') && !uri.includes('neo4j://')) {
        console.error('❌ Neo4j: Invalid URI format');
        this.isConnected = false;
        return;
      }

      // Configure driver for HTTP development environment
      const driverConfig = {
        encrypted: false,
        trust: 'TRUST_ALL_CERTIFICATES'
      };

      // Use neo4j:// instead of neo4j+s:// to avoid encryption conflicts
      const connectionUri = uri.replace('neo4j+s://', 'neo4j://');

      this.driver = neo4j.driver(connectionUri, neo4j.auth.basic(username, password), driverConfig);
      
      // Test connection with timeout
      const session = this.driver.session();
      try {
        // First, test basic connection
        const basicTest = await Promise.race([
          session.run('RETURN 1 as test'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Basic connection timeout')), 5000)
          )
        ]);
        
        // Now test creating a node
        const createTest = await Promise.race([
          session.run('CREATE (t:TestNode {name: "Connection Test", timestamp: datetime()}) RETURN t'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Node creation timeout')), 5000)
          )
        ]);
        
        // Clean up test node
        await session.run('MATCH (t:TestNode {name: "Connection Test"}) DELETE t');
        
        await session.close();
        
        this.isConnected = true;
        console.log('✅ Neo4j connected successfully');
        
        // Initialize database schema
        await this.initializeDatabase();
      } catch (error) {
        await session.close();
        
        // Try HTTP endpoint as fallback
        try {
          const httpUri = uri.replace('neo4j+s://', 'http://');
          this.driver = neo4j.driver(httpUri, neo4j.auth.basic(username, password), {
            encrypted: false,
            trust: 'TRUST_ALL_CERTIFICATES'
          });
          
          const httpSession = this.driver.session();
          const httpTest = await Promise.race([
            httpSession.run('RETURN 1 as test'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('HTTP connection timeout')), 5000)
            )
          ]);
          await httpSession.close();
          
          this.isConnected = true;
          console.log('✅ Neo4j connected via HTTP');
          
          // Initialize database schema
          await this.initializeDatabase();
        } catch (httpError) {
          // Try basic connection without any encryption config
          try {
            this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
            
            const basicSession = this.driver.session();
            const basicTest = await Promise.race([
              basicSession.run('RETURN 1 as test'),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Basic connection timeout')), 5000)
              )
            ]);
            await basicSession.close();
            
            this.isConnected = true;
            console.log('✅ Neo4j connected with basic config');
            
            // Initialize database schema
            await this.initializeDatabase();
          } catch (basicError) {
            throw error; // Throw original error
          }
        }
      }
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error.message);
      this.isConnected = false;
    }
  }

  async executeQuery(query: string, params: Record<string, any> = {}): Promise<any[]> {
    if (!this.driver || !this.isConnected) {
      return [];
    }

    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } catch (error) {
      console.error('❌ Neo4j query error:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  async createCustomer(customer: any): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const query = `
      MERGE (c:Customer {id: $customerId})
      SET c.name = $name,
          c.email = $email,
          c.phone = $phone,
          c.source = $source,
          c.created_at = datetime()
      RETURN c
    `;

    const result = await this.executeQuery(query, {
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      source: customer.source
    });

    return result.length > 0;
  }

  async createSession(customerId: string, sessionId: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const query = `
      MERGE (c:Customer {id: $customerId})
      ON CREATE SET c.created_at = datetime()
      MERGE (s:Session {id: $sessionId})
      MERGE (c)-[:HAS_SESSION]->(s)
      SET s.created_at = datetime(),
          s.platform = 'real_estate_crm'
      RETURN s
    `;

    const result = await this.executeQuery(query, {
      customerId,
      sessionId
    });

    return result.length > 0;
  }

  async addMessageToSession(sessionId: string, message: string, role: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const query = `
      MATCH (s:Session {id: $sessionId})
      CREATE (m:Message {
        content: $content,
        role: $role,
        timestamp: datetime()
      })
      MERGE (s)-[:HAS_MESSAGE]->(m)
      RETURN m
    `;

    const result = await this.executeQuery(query, {
      sessionId,
      content: message,
      role
    });

    return result.length > 0;
  }

  async getCustomerContext(customerId: string): Promise<any> {
    if (!this.isConnected) {
      return this.getFallbackContext(customerId);
    }

    const query = `
      MATCH (c:Customer {id: $customerId})
      OPTIONAL MATCH (c)-[:HAS_SESSION]->(s:Session)
      OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:Message)
      WITH c, count(s) as sessionCount, count(m) as messageCount
      RETURN {
        user_id: c.id,
        preferences: c.preferences,
        interaction_history: {
          total_conversations: sessionCount,
          engagement_level: CASE 
            WHEN messageCount > 10 THEN 'high'
            WHEN messageCount > 5 THEN 'medium'
            ELSE 'low'
          END,
          last_interaction: c.updated_at
        },
        lead_journey: {
          stage: c.lead_stage,
          score: c.lead_score,
          requirements: c.requirements
        }
      } as context
    `;

    const result = await this.executeQuery(query, { customerId });
    return result[0]?.context || this.getFallbackContext(customerId);
  }

  async findSimilarProperties(customerId: string, requirements: any): Promise<any[]> {
    if (!this.isConnected) {
      return [];
    }

    const query = `
      MATCH (c:Customer {id: $customerId})
      MATCH (p:Property)
      WHERE p.type = $propertyType 
        AND p.bhk_type = $bhkType
        AND p.price_min <= $maxBudget
        AND p.location CONTAINS $location
      WITH p, c
      OPTIONAL MATCH (c)-[:VIEWED]->(p)
      RETURN p, count(p) as relevance
      ORDER BY relevance DESC
      LIMIT 5
    `;

    return await this.executeQuery(query, {
      customerId,
      propertyType: requirements.propertyType,
      bhkType: requirements.bhkType,
      maxBudget: requirements.budget,
      location: requirements.location
    });
  }

  async updateCustomerPreferences(customerId: string, preferences: any): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const query = `
      MATCH (c:Customer {id: $customerId})
      SET c.preferences = $preferences,
          c.updated_at = datetime()
      RETURN c
    `;

    const result = await this.executeQuery(query, {
      customerId,
      preferences: JSON.stringify(preferences)
    });

    return result.length > 0;
  }

  async updateLeadScore(customerId: string, score: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const query = `
      MATCH (c:Customer {id: $customerId})
      SET c.lead_score = $score,
          c.updated_at = datetime()
      RETURN c
    `;

    const result = await this.executeQuery(query, { customerId, score });
    return result.length > 0;
  }

  private getFallbackContext(customerId: string): any {
    return {
      user_id: customerId,
      preferences: {},
      interaction_history: {
        total_conversations: 1,
        engagement_level: 'low',
        last_interaction: new Date().toISOString()
      },
      lead_journey: {
        stage: 'new',
        score: 0,
        requirements: {}
      }
    };
  }

  async closeConnection() {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
    }
  }

  async initializeDatabase(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Create indexes for better performance
      await this.executeQuery('CREATE INDEX customer_id IF NOT EXISTS FOR (c:Customer) ON (c.id)');
      await this.executeQuery('CREATE INDEX session_id IF NOT EXISTS FOR (s:Session) ON (s.id)');
      await this.executeQuery('CREATE INDEX property_location IF NOT EXISTS FOR (p:Property) ON (p.location)');

      // Create sample properties
      const sampleProperties = [
        {
          id: 'prop-001',
          title: 'Luxury 2BHK Apartment',
          type: 'apartment',
          bhk_type: '2BHK',
          price_min: 4500000,
          price_max: 5000000,
          location: 'Coimbatore, Race Course',
          description: 'Beautiful 2BHK apartment in prime location',
          amenities: ['Parking', 'Gym', 'Pool', 'Security'],
          area: 1200,
          status: 'available'
        },
        {
          id: 'prop-002',
          title: 'Modern 3BHK Villa',
          type: 'villa',
          bhk_type: '3BHK',
          price_min: 8500000,
          price_max: 9500000,
          location: 'Coimbatore, Peelamedu',
          description: 'Spacious 3BHK villa with garden',
          amenities: ['Garden', 'Parking', 'Security', 'Servant Quarter'],
          area: 2500,
          status: 'available'
        },
        {
          id: 'prop-003',
          title: 'Affordable 1BHK Flat',
          type: 'apartment',
          bhk_type: '1BHK',
          price_min: 2500000,
          price_max: 3000000,
          location: 'Coimbatore, Saibaba Colony',
          description: 'Perfect starter home',
          amenities: ['Parking', 'Security'],
          area: 650,
          status: 'available'
        }
      ];

      // Insert sample properties
      for (const prop of sampleProperties) {
        await this.executeQuery(`
          MERGE (p:Property {id: $id})
          SET p.title = $title,
              p.type = $type,
              p.bhk_type = $bhk_type,
              p.price_min = $price_min,
              p.price_max = $price_max,
              p.location = $location,
              p.description = $description,
              p.amenities = $amenities,
              p.area = $area,
              p.status = $status,
              p.created_at = datetime()
          RETURN p
        `, prop);
      }

      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): { connected: boolean; message: string } {
    if (this.isConnected) {
      return { connected: true, message: 'Connected to Neo4j AuraDB' };
    } else {
      return { connected: false, message: 'Neo4j not configured or connection failed' };
    }
  }
}

export const neo4jConnection = new Neo4jConnection(); 