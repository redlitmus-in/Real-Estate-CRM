import { Customer, Message } from '../types';
import { neo4jConnection } from '../lib/neo4j';

export interface CustomerMemoryContext {
  user_id: string;
  preferences: Record<string, any>;
  interaction_history: {
    total_conversations: number;
    engagement_level: 'high' | 'medium' | 'low';
    last_interaction: string;
  };
  lead_journey: {
    stage: string;
    score: number;
    requirements: Record<string, any>;
  };
}

export class Neo4jMemoryService {
  constructor() {
    // Check connection status
    if (!neo4jConnection.isConnectedToDatabase()) {
      console.warn('Neo4j not connected. Memory features will use fallback.');
    }
  }

  async createCustomer(customer: Customer): Promise<void> {
    try {
      const success = await neo4jConnection.createCustomer(customer);
      if (success) {
        console.log('Customer created in Neo4j:', customer.id);
      } else {
        console.warn('Failed to create customer in Neo4j');
      }
    } catch (error) {
      console.error('Error creating customer in Neo4j:', error);
    }
  }

  async createSession(customerId: string, sessionId: string): Promise<boolean> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return false;
    }
    return await neo4jConnection.createSession(customerId, sessionId);
  }

  async addMessageToSession(sessionId: string, message: string, role: string): Promise<boolean> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return false;
    }
    return await neo4jConnection.addMessageToSession(sessionId, message, role);
  }

  async updateCustomerPreferences(customerId: string, preferences: any): Promise<boolean> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return false;
    }
    return await neo4jConnection.updateCustomerPreferences(customerId, preferences);
  }

  async getCustomerContext(customerId: string): Promise<any> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return this.getFallbackContext(customerId);
    }
    return await neo4jConnection.getCustomerContext(customerId);
  }

  async findSimilarProperties(customerId: string, requirements: any): Promise<any[]> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return [];
    }
    return await neo4jConnection.findSimilarProperties(customerId, requirements);
  }

  async getCustomerRecommendations(customerId: string): Promise<any[]> {
    try {
      // This would be a more complex query for recommendations
      const query = `
        MATCH (c:Customer {id: $customerId})
        MATCH (c)-[:VIEWED]->(p1:Property)
        MATCH (p1)-[:SIMILAR_TO]->(p2:Property)
        WHERE NOT (c)-[:VIEWED]->(p2)
        RETURN p2, count(p2) as recommendation_score
        ORDER BY recommendation_score DESC
        LIMIT 3
      `;
      
      const result = await neo4jConnection.executeQuery(query, { customerId });
      return result;
    } catch (error) {
      console.error('Error getting customer recommendations from Neo4j:', error);
      return [];
    }
  }

  async updateLeadScore(customerId: string, score: number): Promise<boolean> {
    if (!neo4jConnection.isConnectedToDatabase()) {
      return false;
    }
    return await neo4jConnection.updateLeadScore(customerId, score);
  }

  private getFallbackContext(customerId: string): CustomerMemoryContext {
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
}

export const neo4jMemoryService = new Neo4jMemoryService(); 