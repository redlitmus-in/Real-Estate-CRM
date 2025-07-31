import { Customer, Lead, Property, Message } from '../types';
import { neo4jMemoryService, CustomerMemoryContext } from './neo4jMemoryService';

// Enhanced AI Agent State with Langraph-style conversation flow
interface AIAgentState {
  customerId: string;
  conversationId: string;
  currentStage: 'greeting' | 'name_collection' | 'qualification' | 'budget_collection' | 'location_collection' | 'property_matching' | 'scheduling' | 'follow_up';
  collectedInfo: Record<string, any>;
  conversationHistory: ConversationMessage[];
  lastInteraction: string;
  userIntent: string;
  qualificationScore: number;
  isQualified: boolean;
  retryCount: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface AIResponse {
  message: string;
  nextStage: string;
  actions: string[];
  shouldCreateLead: boolean;
  shouldScheduleFollowUp: boolean;
  confidence: number;
  extractedInfo: Record<string, any>;
}

export class AIAgentService {
  private agentStates: Map<string, AIAgentState> = new Map();
  private openAIKey: string;
  private realEstatePersona: string;

  constructor() {
    this.openAIKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.realEstatePersona = `You are Priya, a friendly and professional real estate consultant with 8 years of experience in the Indian property market. 

Your personality:
- Warm, approachable, and genuinely helpful
- Expert knowledge of properties across India, with special focus on major cities
- Patient with first-time buyers and experienced with investors
- Always ask qualifying questions to understand customer needs
- Use relevant emojis to make conversations engaging
- Speak in a conversational, consultative tone

Your expertise:
- Residential properties: apartments, villas, plots
- Commercial properties: offices, retail spaces
- Investment guidance and ROI calculations
- Legal documentation and registration process
- Home loan assistance and financial planning

You can help with properties in any city across India, including:
- Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Pune
- Coimbatore, Kochi, Ahmedabad, Kolkata, and other cities
- Tier 2 and Tier 3 cities as well

Always prioritize understanding the customer's:
1. Budget range
2. Preferred location (city and area)
3. Property type and size (BHK)
4. Timeline for purchase/investment
5. Financing requirements

IMPORTANT: 
- Be conversational, acknowledge what the customer has already told you
- Ask for the next missing piece of information naturally
- Don't repeat questions they've already answered
- When customer mentions a specific city, acknowledge it and search for properties in that area
- If properties aren't available in their preferred city, suggest alternatives or explain the situation honestly`;

    if (!this.openAIKey) {
      console.warn('OpenAI API key not configured. Set VITE_OPENAI_API_KEY environment variable for real AI responses.');
    } else {
      console.log('OpenAI integration enabled with API key');
    }
  }

  // Initialize or get agent state for a customer (Langraph-style state management)
  private async getAgentState(customer: Customer, conversationId: string, messageHistory: Message[], customerContext: CustomerMemoryContext | null): Promise<AIAgentState> {
    const stateKey = `${customer.id}_${conversationId}`;
    
    if (!this.agentStates.has(stateKey)) {
      // Initialize Neo4j session for new customer
      try {
        console.log('Creating Neo4j session for customer:', customer.id);
        await neo4jMemoryService.createSession(customer.id, conversationId);
        console.log('Neo4j session created successfully');
      } catch (error) {
        console.error('Error creating Neo4j session:', error);
      }

      this.agentStates.set(stateKey, {
        customerId: customer.id,
        conversationId,
        currentStage: 'greeting',
        collectedInfo: {},
        conversationHistory: [],
        lastInteraction: new Date().toISOString(),
        userIntent: 'property_inquiry',
        qualificationScore: 0,
        isQualified: false,
        retryCount: 0,
      });
    }
    
    const agentState = this.agentStates.get(stateKey)!;

    // Update conversation history from message history
    agentState.conversationHistory = messageHistory.map(msg => ({
      role: msg.sender_type === 'customer' ? 'user' : 'assistant',
      content: msg.content || '',
      timestamp: msg.created_at || new Date().toISOString()
    }));

    // Update last interaction
    agentState.lastInteraction = new Date().toISOString();

    // Update user intent from Neo4j context
    agentState.userIntent = customerContext?.interaction_history?.engagement_level || 'property_inquiry';

    // Update qualification score from Neo4j context
    agentState.qualificationScore = customerContext?.lead_journey?.score || 0;
    agentState.isQualified = agentState.qualificationScore >= 70;

    return agentState;
  }

  private async saveAgentState(customerId: string, conversationId: string, agentState: AIAgentState): Promise<void> {
    const stateKey = `${customerId}_${conversationId}`;
    this.agentStates.set(stateKey, agentState);
  }

  // Process incoming message with enhanced AI agent (Langraph-style conversation flow)
  async processMessage(
    customer: Customer,
    conversationId: string,
    messageContent: string,
    messageHistory: Message[] = []
  ): Promise<AIResponse> {
    try {
      console.log('Processing message with AI agent:', { customerId: customer.id, conversationId, messageContent });

      // Get or create Neo4j session for memory
      await neo4jMemoryService.createSession(customer.id, conversationId);

      // Get customer context from Neo4j memory
      const customerContext = await neo4jMemoryService.getCustomerContext(customer.id, conversationId);

      // Get current agent state
      const agentState = await this.getAgentState(customer, conversationId, messageHistory, customerContext);

      // Extract information from message
      const extractedInfo = await this.extractInformationWithAI(messageContent);
      
      // Update collected info
      Object.assign(agentState.collectedInfo, extractedInfo);

      // Add user message to Neo4j session
      await neo4jMemoryService.addMessageToSession(conversationId, messageContent, 'user');

      // Generate contextual response
      const response = await this.generateContextualResponse(agentState, messageContent, customerContext);

      // Add AI response to Neo4j session
      if (response.message) {
        await neo4jMemoryService.addMessageToSession(conversationId, response.message, 'assistant');
      }

      // Update conversation history
      agentState.conversationHistory.push({
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString()
      });

      if (response.message) {
        agentState.conversationHistory.push({
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString()
        });
      }

      // Save updated state
      await this.saveAgentState(customer.id, conversationId, agentState);

      return {
        ...response,
        extractedInfo
      };

    } catch (error) {
      console.error('Error in AI agent processing:', error);
      return this.getFallbackResponse({
        customerId: '',
        conversationId: '',
        currentStage: 'greeting',
        collectedInfo: {},
        conversationHistory: [],
        lastInteraction: '',
        userIntent: '',
        qualificationScore: 0,
        isQualified: false,
        retryCount: 0
      });
    }
  }

  // Real AI processing with OpenAI
  private async callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>): Promise<string> {
    if (!this.openAIKey) {
      console.warn('OpenAI API key not configured. Using mock response for demonstration.');
      return this.getMockResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return this.getFallbackResponse({
        customerId: '',
        conversationId: '',
        currentStage: 'greeting',
        collectedInfo: {},
        conversationHistory: [],
        lastInteraction: '',
        userIntent: '',
        qualificationScore: 0,
        isQualified: false,
        retryCount: 0
      }).message;
    }
  }

  // Enhanced AI response with property suggestions
  private async generateAIResponseWithProperties(
    message: string,
    state: AIAgentState,
    customerContext?: CustomerMemoryContext | null
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(state, customerContext);
    
    // Search for properties if we have requirements
    let propertySuggestions = '';
    if (state.collectedInfo.propertyType || state.collectedInfo.budget || state.collectedInfo.location) {
      const properties = await this.searchProperties(state.collectedInfo);
      
      if (properties.length > 0) {
        propertySuggestions = '\n\n**Available Properties:**\n' + 
          properties.map(prop => this.formatPropertyDetails(prop)).join('\n\n');
      } else {
        propertySuggestions = '\n\nCurrently, I don\'t have properties matching your exact requirements. Would you like me to show you similar properties or help you refine your search?';
      }
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      { role: 'system', content: systemPrompt },
      ...state.conversationHistory.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const aiResponse = await this.callOpenAI(messages);
    
    // Combine AI response with property suggestions
    const fullResponse = aiResponse + propertySuggestions;
    console.log('AI response with properties:', { aiResponse, propertySuggestions, fullResponse });
    
    return fullResponse;
  }

  // Build comprehensive system prompt
  private buildSystemPrompt(state: AIAgentState, customerContext?: CustomerMemoryContext | null): string {
    let prompt = this.realEstatePersona;
    
    // Add customer context if available
    if (customerContext) {
      prompt += `\n\nCustomer Context:
- Previous preferences: ${JSON.stringify(customerContext.preferences)}
- Interaction history: ${customerContext.interaction_history.total_conversations} conversations
- Engagement level: ${customerContext.interaction_history.engagement_level}
- Lead stage: ${customerContext.lead_journey.stage}`;
    }

    // Add current conversation state
    prompt += `\n\nCurrent Conversation State:
- Stage: ${state.currentStage}
- Collected info: ${JSON.stringify(state.collectedInfo)}
- Qualification score: ${state.qualificationScore}

Instructions:
1. Be conversational and helpful
2. Ask relevant questions based on missing information
3. Provide specific, actionable responses
4. Use emojis to make responses engaging
5. If customer provides budget/location/property type, acknowledge and ask for next missing detail
6. Don't repeat the same question if information was already provided
7. Progress the conversation naturally`;

    return prompt;
  }

  // Property search functionality
  private async searchProperties(requirements: Record<string, any>): Promise<any[]> {
    try {
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) {
        console.error('Supabase client not available');
        return [];
      }

      // Properties already exist in your database, no need to create samples

      let query = supabase
        .from('properties')
        .select('*')
        .eq('company_id', '550e8400-e29b-41d4-a716-446655440001')
        .eq('status', 'available');

      // Filter by property type
      if (requirements.propertyType) {
        query = query.eq('type', requirements.propertyType);
      }

      // Filter by BHK
      if (requirements.bhkType) {
        query = query.eq('bhk_type', requirements.bhkType);
      }

      // Filter by budget - use price_max field
      if (requirements.budget) {
        const budget = parseFloat(requirements.budget);
        query = query.lte('price_max', budget * 1.2).gte('price_min', budget * 0.8); // Budget range flexibility
      }

      // Filter by location - search in JSONB location field and other text fields
      if (requirements.location) {
        const location = requirements.location.toLowerCase();
        // Search in location JSONB, title, and description
        query = query.or(`location->>address->>city.ilike.%${location}%,location->>locality.ilike.%${location}%,title.ilike.%${location}%,description.ilike.%${location}%`);
      }

      const { data: properties, error } = await query.limit(5);

      if (error) {
        console.error('Error searching properties:', error);
        // Return sample properties as fallback
        return this.getSamplePropertiesForLocation(requirements.location || 'coimbatore');
      }

      return properties || this.getSamplePropertiesForLocation(requirements.location || 'coimbatore');
    } catch (error) {
      console.error('Error in property search:', error);
      return this.getSamplePropertiesForLocation(requirements.location || 'coimbatore');
    }
  }

  private async createSampleProperties(): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const sampleProperties = [
        {
          id: crypto.randomUUID(),
          company_id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Luxury 2BHK Apartment in Coimbatore',
          type: 'apartment',
          bhk_type: '2BHK',
          price: 4500000,
          city: 'Coimbatore',
          description: 'Beautiful 2BHK apartment in Race Course area with modern amenities',
          amenities: ['Parking', 'Gym', 'Pool', 'Security'],
          area_sqft: 1200,
          status: 'available'
        },
        {
          id: crypto.randomUUID(),
          company_id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Modern 3BHK Villa in Coimbatore',
          type: 'villa',
          bhk_type: '3BHK',
          price: 5500000,
          city: 'Coimbatore',
          description: 'Spacious 3BHK villa in Peelamedu with garden and parking',
          amenities: ['Garden', 'Parking', 'Security', 'Servant Quarter'],
          area_sqft: 2200,
          status: 'available'
        },
        {
          id: crypto.randomUUID(),
          company_id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Premium 3BHK Villa in Coimbatore',
          type: 'villa',
          bhk_type: '3BHK',
          price: 6500000,
          city: 'Coimbatore',
          description: 'Premium 3BHK villa in RS Puram with all modern facilities',
          amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Gym'],
          area_sqft: 2500,
          status: 'available'
        }
      ];

      const { error } = await supabase
        .from('properties')
        .insert(sampleProperties);

      if (error) {
        console.error('Error creating sample properties:', error);
      } else {
        console.log('Sample properties created successfully');
      }
    } catch (error) {
      console.error('Error creating sample properties:', error);
    }
  }

  // Fallback method to return sample properties when database fails
  private getSamplePropertiesForLocation(location: string): any[] {
    const locationLower = location.toLowerCase();
    
    const allSampleProperties = [
      {
        id: 'sample-1',
        title: `Luxury 3BHK Villa in ${location}`,
        type: 'villa',
        bhk_type: '3BHK',
        price_min: 5000000,
        price_max: 5500000,
        location: {
          address: { city: location, state: 'Tamil Nadu', country: 'India' },
          locality: 'Premium Area'
        },
        description: `Beautiful 3BHK villa in prime ${location} location with modern amenities`,
        amenities: ['Garden', 'Parking', 'Security', 'Swimming Pool'],
        area_sqft: '2200',
        status: 'available'
      },
      {
        id: 'sample-2',
        title: `Modern 3BHK Villa in ${location}`,
        type: 'villa',
        bhk_type: '3BHK',
        price_min: 5800000,
        price_max: 6200000,
        location: {
          address: { city: location, state: 'Tamil Nadu', country: 'India' },
          locality: 'Residential Colony'
        },
        description: `Spacious 3BHK villa in ${location} with garden and premium finishes`,
        amenities: ['Garden', 'Parking', 'Security', 'Gym'],
        area_sqft: '2400',
        status: 'available'
      }
    ];

    return allSampleProperties;
  }

  // Format property details for AI response
  private formatPropertyDetails(property: any): string {
    // Handle price range
    let price = 'Price on request';
    if (property.price_min && property.price_max) {
      const minPrice = (property.price_min / 100000).toFixed(1);
      const maxPrice = (property.price_max / 100000).toFixed(1);
      price = minPrice === maxPrice ? `₹${minPrice}L` : `₹${minPrice}L - ₹${maxPrice}L`;
    } else if (property.price_min) {
      price = `₹${(property.price_min / 100000).toFixed(1)}L`;
    }
    
    const area = property.area_sqft ? `${property.area_sqft} sq ft` : '';
    
    // Extract location from JSONB structure
    let location = 'Location details available';
    if (property.location?.address?.city) {
      const city = property.location.address.city;
      const locality = property.location.locality;
      location = locality ? `${locality}, ${city}` : city;
    }
    
    return `🏠 **${property.title}**
💰 Price: ${price}
📍 Location: ${location}
${area ? `📏 Area: ${area}` : ''}
${property.amenities?.length ? `✨ Amenities: ${property.amenities.slice(0, 3).join(', ')}` : ''}`;
  }

  private async generateContextualResponse(
    state: AIAgentState,
    message: string,
    customerContext?: CustomerMemoryContext | null
  ): Promise<AIResponse> {
    try {
      // Check if we have previous context from conversation history
      const previousPreferences = this.extractPreferencesFromHistory(state.conversationHistory);
      
      // Merge collected info with previous preferences
      const allPreferences = { ...previousPreferences, ...state.collectedInfo };
      
      console.log('All preferences from history and current:', allPreferences);
      
      // If we have enough context, proceed with property search
      if (this.hasEnoughContext(allPreferences)) {
        const properties = await this.searchProperties(allPreferences);
        
        if (properties.length > 0) {
          const propertyList = properties.map(prop => this.formatPropertyDetails(prop)).join('\n\n');
          
          return {
            message: `Perfect! Based on your requirements, here are some great properties I found:\n\n${propertyList}\n\nWould you like more details about any of these properties?`,
            nextStage: 'property_matching',
            actions: ['show_properties'],
            shouldCreateLead: true,
            shouldScheduleFollowUp: true,
            confidence: 0.95,
            extractedInfo: allPreferences
          };
        }
      }
      
      // Use real AI with property search for response generation
      const aiResponse = await this.generateAIResponseWithProperties(message, state, customerContext);
      
      // Determine next stage based on collected info and AI response
      const nextStage = this.determineNextStage(allPreferences, aiResponse);
      
      // Determine actions based on AI response and stage
      const actions = this.determineActions(nextStage, allPreferences);
      
      return {
        message: aiResponse,
        nextStage: nextStage,
        actions: actions,
        shouldCreateLead: this.shouldCreateLead(allPreferences),
        shouldScheduleFollowUp: this.shouldScheduleFollowUp(allPreferences),
        confidence: 0.9,
        extractedInfo: allPreferences
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback to stage-based responses
      const fallbackResponse = this.getStageBasedResponse(state, message);
      return {
        ...fallbackResponse,
        extractedInfo: {}
      };
    }
  }

  // Determine next stage based on collected information
  private determineNextStage(collectedInfo: Record<string, any>, aiResponse: string): string {
    if (!collectedInfo.name) return 'name_collection';
    if (!collectedInfo.propertyType) return 'qualification';
    if (!collectedInfo.budget) return 'budget_collection';
    if (!collectedInfo.location) return 'location_collection';
    if (this.isQualified(collectedInfo)) return 'property_matching';
    return 'qualification';
  }

  // Determine actions based on stage and collected info
  private determineActions(stage: string, collectedInfo: Record<string, any>): string[] {
    switch (stage) {
      case 'name_collection':
        return ['collect_name'];
      case 'qualification':
        return ['collect_property_type', 'collect_budget', 'collect_location'];
      case 'budget_collection':
        return ['collect_budget'];
      case 'location_collection':
        return ['collect_location'];
      case 'property_matching':
        return ['search_properties', 'create_qualified_lead'];
      default:
        return ['continue_conversation'];
    }
  }

  // Check if customer is qualified
  private isQualified(collectedInfo: Record<string, any>): boolean {
    return !!(collectedInfo.name && collectedInfo.propertyType && collectedInfo.budget && collectedInfo.location);
  }

  // Determine if should create lead
  private shouldCreateLead(collectedInfo: Record<string, any>): boolean {
    return this.isQualified(collectedInfo);
  }

  // Determine if should schedule follow-up
  private shouldScheduleFollowUp(collectedInfo: Record<string, any>): boolean {
    return this.isQualified(collectedInfo);
  }

  // Fallback to stage-based responses if AI fails
  private getStageBasedResponse(state: AIAgentState, message: string): AIResponse {
    switch (state.currentStage) {
      case 'greeting':
        return this.handleGreetingStage(message, state.collectedInfo, state.userIntent);
      case 'name_collection':
        return this.handleNameCollectionStage(message, state.collectedInfo);
      case 'qualification':
        return this.handleQualificationStage(message, state.collectedInfo, state.qualificationScore);
      case 'budget_collection':
        return this.handleBudgetCollectionStage(message, state.collectedInfo);
      case 'location_collection':
        return this.handleLocationCollectionStage(message, state.collectedInfo);
      case 'property_matching':
        return this.handlePropertyMatchingStage(state.collectedInfo);
      default:
        return this.getFallbackResponse(state);
    }
  }

  // Enhanced information extraction using AI with Neo4j memory context
  private async extractInformationWithAI(message: string): Promise<Record<string, any>> {
    try {
      const systemPrompt = `
        You are an AI assistant for a real estate company. Extract relevant information from user messages.
        Focus on: location, property type, budget, BHK type, timeline, and any specific requirements.
        Return only a JSON object with the extracted information.
        
        Important budget conversions:
        - "10 lakhs" = 1000000
        - "5 crore" = 50000000
        - "50k" = 50000
      `;

      const userPrompt = `
        Extract information from this message: "${message}"
        
        Return a JSON object with any of these fields if found:
        - location: city or area (e.g., "coimbatore", "gandhi puram")
        - propertyType: apartment, villa, house, etc.
        - bhkType: 1BHK, 2BHK, 3BHK, etc.
        - budget: price in numbers (convert lakhs/crore to actual numbers)
        - timeline: when they want to buy
        - requirements: any specific needs
        
        Example: "3BHK villa in Coimbatore for 10 lakhs" should return:
        {
          "location": "coimbatore",
          "propertyType": "villa", 
          "bhkType": "3BHK",
          "budget": 1000000
        }
      `;

      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      
      try {
        const extractedInfo = JSON.parse(response);
        console.log('Extracted information:', extractedInfo);
        return extractedInfo;
      } catch (parseError) {
        console.error('Failed to parse extracted info:', parseError);
        return {};
      }
    } catch (error) {
      console.error('Error extracting information:', error);
      return {};
    }
  }

  // Mock response for demonstration purposes
  private getMockResponse(message: string): string {
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm Priya, your real estate consultant. How can I help you find your dream property today? 🏠✨";
    }
    if (message.includes('apartment') || message.includes('flat') || message.includes('house')) {
      return "Great! What type of property are you looking for - apartment, villa, or plot? 🏘️";
    }
    if (message.includes('villa')) {
      return "Perfect! What's your budget range? This will help me find the best options for you. 💰";
    }
    if (message.includes('budget') || message.includes('price') || message.includes('amount')) {
      return "Excellent! Which area or city are you interested in? 🏙️";
    }
    if (message.includes('location') || message.includes('city') || message.includes('area')) {
      return "Perfect! Let me search for properties that match your requirements. 🔍";
    }
    if (message.includes('property') || message.includes('find') || message.includes('search')) {
      return "I found some great properties for you! Would you like to schedule a site visit? 📅";
    }
    return "I'm here to help you find your perfect property! What are you looking for? 🏠";
  }

  // Stage-based response handlers
  private handleGreetingStage(message: string, collectedInfo: Record<string, any>, userIntent: string): AIResponse {
    return {
      message: "Hello! I'm Priya, your real estate consultant. How can I help you find your dream property today? 🏠✨",
      nextStage: 'name_collection',
      actions: ['collect_name'],
      shouldCreateLead: false,
      shouldScheduleFollowUp: false,
      confidence: 0.8,
      extractedInfo: {}
    };
  }

  private handleNameCollectionStage(message: string, collectedInfo: Record<string, any>): AIResponse {
    return {
      message: "Great! What type of property are you looking for - apartment, villa, or plot? 🏘️",
      nextStage: 'qualification',
      actions: ['collect_property_type'],
      shouldCreateLead: false,
      shouldScheduleFollowUp: false,
      confidence: 0.8,
      extractedInfo: {}
    };
  }

  private handleQualificationStage(message: string, collectedInfo: Record<string, any>, qualificationScore: number): AIResponse {
    return {
      message: "Perfect! What's your budget range? This will help me find the best options for you. 💰",
      nextStage: 'budget_collection',
      actions: ['collect_budget'],
      shouldCreateLead: false,
      shouldScheduleFollowUp: false,
      confidence: 0.8,
      extractedInfo: {}
    };
  }

  private handleBudgetCollectionStage(message: string, collectedInfo: Record<string, any>): AIResponse {
    return {
      message: "Excellent! Which area or city are you interested in? 🏙️",
      nextStage: 'location_collection',
      actions: ['collect_location'],
      shouldCreateLead: false,
      shouldScheduleFollowUp: false,
      confidence: 0.8,
      extractedInfo: {}
    };
  }

  private handleLocationCollectionStage(message: string, collectedInfo: Record<string, any>): AIResponse {
    return {
      message: "Perfect! Let me search for properties that match your requirements. 🔍",
      nextStage: 'property_matching',
      actions: ['search_properties'],
      shouldCreateLead: true,
      shouldScheduleFollowUp: true,
      confidence: 0.9,
      extractedInfo: {}
    };
  }

  private handlePropertyMatchingStage(collectedInfo: Record<string, any>): AIResponse {
    return {
      message: "I found some great properties for you! Would you like to schedule a site visit? 📅",
      nextStage: 'scheduling',
      actions: ['schedule_visit'],
      shouldCreateLead: true,
      shouldScheduleFollowUp: true,
      confidence: 0.9,
      extractedInfo: {}
    };
  }

  private getFallbackResponse(state: AIAgentState): AIResponse {
    return {
      message: "I'm here to help you find your perfect property! What are you looking for? 🏠",
      nextStage: 'greeting',
      actions: ['continue_conversation'],
      shouldCreateLead: false,
      shouldScheduleFollowUp: false,
      confidence: 0.7,
      extractedInfo: {}
    };
  }

  // Extract preferences from conversation history for better context
  private extractPreferencesFromHistory(conversationHistory: ConversationMessage[]): Record<string, any> {
    const preferences: Record<string, any> = {};
    const allBudgets: number[] = [];
    
    for (const msg of conversationHistory) {
      if (msg.role === 'user' && msg.content) {
        const content = msg.content.toLowerCase();
        
        // Extract budget information
        const budgetMatches = content.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/gi);
        if (budgetMatches) {
          for (const match of budgetMatches) {
            const budgetMatch = match.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i);
            if (budgetMatch) {
              const amount = parseFloat(budgetMatch[1]);
              const unit = budgetMatch[2].toLowerCase();
              const budgetValue = unit.startsWith('cr') ? amount * 10000000 : amount * 100000;
              allBudgets.push(budgetValue);
            }
          }
        }
        
        // Extract numeric ranges like "4500000 to 5500000" or just large numbers
        const rangeMatch = content.match(/(\d{6,})\s*to\s*(\d{6,})/i);
        if (rangeMatch) {
          allBudgets.push(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
        } else {
          const largeNumberMatch = content.match(/\b(\d{7,})\b/);
          if (largeNumberMatch) {
            allBudgets.push(parseInt(largeNumberMatch[1]));
          }
        }
        
        // Extract property type
        if (content.includes('villa')) preferences.propertyType = 'villa';
        if (content.includes('apartment') || content.includes('flat')) preferences.propertyType = 'apartment';
        if (content.includes('plot')) preferences.propertyType = 'plot';
        
        // Extract BHK
        const bhkMatch = content.match(/(\d+)\s*bhk/i);
        if (bhkMatch) preferences.bhkType = `${bhkMatch[1]}BHK`;
        
        // Extract area
        const areaMatch = content.match(/(\d+)\s*(sqft|sq\.?\s*ft|square\s*feet)/i);
        if (areaMatch) preferences.area = parseInt(areaMatch[1]);
        
        // Extract locations
        const cities = ['coimbatore', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune'];
        for (const city of cities) {
          if (content.includes(city)) {
            preferences.location = city;
            break;
          }
        }
      }
    }
    
    // Set budget from all collected values
    if (allBudgets.length > 0) {
      const minBudget = Math.min(...allBudgets);
      const maxBudget = Math.max(...allBudgets);
      preferences.budget = maxBudget; // Use max for search
      preferences.budgetRange = { min: minBudget, max: maxBudget };
    }
    
    return preferences;
  }

  // Check if we have enough context to show properties
  private hasEnoughContext(preferences: Record<string, any>): boolean {
    return !!(preferences.location && preferences.propertyType && (preferences.budget || preferences.budgetRange));
  }
}

export const aiAgentService = new AIAgentService();