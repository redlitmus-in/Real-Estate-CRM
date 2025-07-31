import { supabase } from '../lib/supabase';
import { whatsappService } from './whatsappService';
import { aiAgentService } from './aiAgentService';
import { Customer, Lead, Message } from '../types';

interface LeadAutomationConfig {
  autoLeadCreation: boolean;
  aiQualificationEnabled: boolean;
  serviceMessageAutoReply: boolean;
  leadScoringEnabled: boolean;
  autoAssignment: boolean;
}

export class LeadAutomationService {
  private config: LeadAutomationConfig;

  constructor() {
    this.config = {
      autoLeadCreation: import.meta.env.VITE_AUTO_LEAD_CREATION === 'true',
      aiQualificationEnabled: import.meta.env.VITE_AI_QUALIFICATION_ENABLED === 'true',
      serviceMessageAutoReply: import.meta.env.VITE_SERVICE_MESSAGE_AUTO_REPLY === 'true',
      leadScoringEnabled: true,
      autoAssignment: true,
    };
  }

  // Process incoming WhatsApp message for lead automation
  async processIncomingMessage(
    customer: Customer,
    conversationId: string,
    message: Message
  ): Promise<void> {
    try {
      // 1. Auto-reply with AI agent if enabled
      if (this.config.serviceMessageAutoReply && this.config.aiQualificationEnabled) {
        await this.handleAIResponse(customer, conversationId, message);
      }

      // 2. Create lead if auto-creation is enabled
      if (this.config.autoLeadCreation) {
        await this.createLeadIfNeeded(customer, message);
      }

      // 3. Update lead scoring if enabled
      if (this.config.leadScoringEnabled) {
        await this.updateLeadScoring(customer, message);
      }

      // 4. Auto-assign to agent if configured
      if (this.config.autoAssignment) {
        await this.autoAssignLead(customer);
      }

      // 5. Trigger follow-up actions
      await this.triggerFollowUpActions(customer, message);

    } catch (error) {
      console.error('Error in lead automation process:', error);
    }
  }

  // Handle AI response generation and sending
  private async handleAIResponse(
    customer: Customer,
    conversationId: string,
    message: Message
  ): Promise<void> {
    try {
      // Get message history for context
      const messageHistory = await this.getMessageHistory(conversationId);
      
      // Process with AI agent
      const aiResponse = await aiAgentService.processMessage(
        customer,
        conversationId,
        message.content || '',
        messageHistory
      );

      // Send AI response via WhatsApp
      if (customer.whatsapp_number) {
        await whatsappService.sendMessage(
          customer.whatsapp_number,
          aiResponse.message
        );

        // Save AI response as message
        await this.saveAIMessage(conversationId, aiResponse.message);
      }

      // Execute additional actions
      await this.executeAIActions(customer, aiResponse.actions, aiResponse);

    } catch (error) {
      console.error('Error handling AI response:', error);
      
      // Send fallback message
      if (customer.whatsapp_number) {
        await whatsappService.sendMessage(
          customer.whatsapp_number,
          "Thank you for your message! Our team will get back to you shortly."
        );
      }
    }
  }

  // Create lead if message indicates property interest
  private async createLeadIfNeeded(customer: Customer, message: Message): Promise<void> {
    if (!supabase) return;

    const messageContent = message.content?.toLowerCase() || '';
    
    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();

    if (existingLead) return; // Lead already exists

    // Keywords that indicate property interest
    const propertyKeywords = [
      'property', 'apartment', 'villa', 'plot', 'house', 'flat',
      'buy', 'purchase', 'invest', 'rent', 'lease',
      'bhk', '2bhk', '3bhk', '4bhk',
      'budget', 'price', 'cost',
      'location', 'area', 'locality',
      'looking for', 'interested in', 'want to buy'
    ];

    const hasPropertyInterest = propertyKeywords.some(keyword => 
      messageContent.includes(keyword)
    );

    if (hasPropertyInterest) {
      const leadData = {
        customer_id: customer.id,
        company_id: customer.company_id,
        source: 'whatsapp' as const,
        stage: 'new' as const,
        score: this.calculateInitialLeadScore(messageContent, customer),
        requirements: this.extractRequirements(messageContent),
        notes: `Auto-created from WhatsApp message: "${message.content}"`,
        status: 'active' as const,
      };

      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
      } else {
        console.log('Lead created automatically:', newLead);
        
        // Trigger lead creation webhook/notification
        await this.notifyLeadCreation(newLead, customer);
      }
    }
  }

  // Update lead scoring based on customer interactions
  private async updateLeadScoring(customer: Customer, message: Message): Promise<void> {
    if (!supabase) return;

    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'active');

      if (!leads || leads.length === 0) return;

      for (const lead of leads) {
        const newScore = this.calculateUpdatedLeadScore(lead, message, customer);
        
        if (newScore !== lead.score) {
          await supabase
            .from('leads')
            .update({ 
              score: newScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          // Check if lead became high-priority
          if (newScore >= 80 && lead.score < 80) {
            await this.handleHighPriorityLead(lead, customer);
          }
        }
      }
    } catch (error) {
      console.error('Error updating lead scoring:', error);
    }
  }

  // Auto-assign lead to available agent
  private async autoAssignLead(customer: Customer): Promise<void> {
    if (!supabase) return;

    try {
      // Find unassigned leads for this customer
      const { data: unassignedLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'active')
        .is('assigned_to', null);

      if (!unassignedLeads || unassignedLeads.length === 0) return;

      // Find available agent (simple round-robin for now)
      const { data: agents } = await supabase
        .from('users')
        .select('id, name')
        .eq('company_id', customer.company_id)
        .eq('role', 'agent')
        .eq('status', 'active')
        .limit(1);

      if (agents && agents.length > 0) {
        const agent = agents[0];
        
        for (const lead of unassignedLeads) {
          await supabase
            .from('leads')
            .update({ 
              assigned_to: agent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          // Notify agent about new assignment
          await this.notifyAgentAssignment(lead, agent, customer);
        }
      }
    } catch (error) {
      console.error('Error in auto-assignment:', error);
    }
  }

  // Trigger follow-up actions based on message content and timing
  private async triggerFollowUpActions(customer: Customer, message: Message): Promise<void> {
    try {
      const messageContent = message.content?.toLowerCase() || '';
      
      // Schedule follow-up based on message intent
      if (messageContent.includes('call me') || messageContent.includes('contact me')) {
        await this.scheduleCallback(customer, 'immediate');
      } else if (messageContent.includes('visit') || messageContent.includes('show')) {
        await this.scheduleSiteVisit(customer);
      } else if (messageContent.includes('brochure') || messageContent.includes('details')) {
        await this.sendPropertyBrochure(customer);
      }

      // Check for urgency indicators
      const urgentKeywords = ['urgent', 'asap', 'immediate', 'today', 'now'];
      const isUrgent = urgentKeywords.some(keyword => messageContent.includes(keyword));
      
      if (isUrgent) {
        await this.handleUrgentLead(customer);
      }

    } catch (error) {
      console.error('Error triggering follow-up actions:', error);
    }
  }

  // Helper methods
  private async getMessageHistory(conversationId: string): Promise<Message[]> {
    if (!supabase) return [];

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    return messages as Message[] || [];
  }

  private async saveAIMessage(conversationId: string, content: string): Promise<void> {
    if (!supabase) return;

    await supabase.from('messages').insert([{
      conversation_id: conversationId,
      platform_message_id: `ai_${Date.now()}`,
      sender_type: 'system',
      content,
      message_type: 'text',
      status: 'sent',
      metadata: { ai_generated: true },
    }]);
  }

  private async executeAIActions(
    customer: Customer, 
    actions: string[], 
    aiResponse: any
  ): Promise<void> {
    for (const action of actions) {
      switch (action) {
        case 'create_qualified_lead':
          if (aiResponse.shouldCreateLead) {
            await this.createQualifiedLead(customer, aiResponse.extractedInfo);
          }
          break;
        
        case 'schedule_callback':
          if (aiResponse.shouldScheduleFollowUp) {
            await this.scheduleCallback(customer, '2 hours');
          }
          break;
        
        case 'search_properties':
          await this.searchAndSendProperties(customer, aiResponse.extractedInfo);
          break;
        
        case 'assign_to_agent':
          await this.autoAssignLead(customer);
          break;
      }
    }
  }

  private calculateInitialLeadScore(content: string, customer: Customer): number {
    let score = 50; // Base score

    // Content-based scoring
    if (content.includes('budget')) score += 15;
    if (content.includes('buy') || content.includes('purchase')) score += 20;
    if (content.includes('urgent') || content.includes('immediate')) score += 10;
    if (content.includes('loan') || content.includes('finance')) score += 10;
    if (content.match(/\d+\s*bhk/i)) score += 15;

    // Customer-based scoring
    if (customer.source === 'whatsapp') score += 10;
    if (customer.tags.includes('repeat-customer')) score += 20;

    return Math.min(score, 100);
  }

  private calculateUpdatedLeadScore(lead: any, message: Message, customer: Customer): number {
    let score = lead.score;
    const content = message.content?.toLowerCase() || '';

    // Engagement scoring
    score += 5; // Each interaction adds points

    // Intent scoring
    if (content.includes('interested') || content.includes('yes')) score += 10;
    if (content.includes('not interested') || content.includes('no')) score -= 15;
    if (content.includes('think about it')) score -= 5;

    // Urgency scoring
    if (content.includes('urgent') || content.includes('asap')) score += 15;

    return Math.max(0, Math.min(score, 100));
  }

  private extractRequirements(content: string): Record<string, any> {
    const requirements: Record<string, any> = {};
    
    // Extract BHK type
    const bhkMatch = content.match(/(\d+)\s*bhk/i);
    if (bhkMatch) {
      requirements.bhk_type = `${bhkMatch[1]}BHK`;
    }

    // Extract budget
    const budgetMatch = content.match(/budget.*?(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i);
    if (budgetMatch) {
      const amount = parseFloat(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      requirements.budget_max = unit.startsWith('cr') ? amount * 10000000 : amount * 100000;
      requirements.budget_min = requirements.budget_max * 0.8;
    }

    // Extract location
    const locationKeywords = ['in', 'at', 'near', 'around'];
    for (const keyword of locationKeywords) {
      const regex = new RegExp(`${keyword}\\s+([a-zA-Z\\s]+?)(?:\\s|$|,|\\.)`, 'i');
      const match = content.match(regex);
      if (match) {
        requirements.preferred_location = match[1].trim();
        break;
      }
    }

    return requirements;
  }

  // Notification and action methods
  private async notifyLeadCreation(lead: any, customer: Customer): Promise<void> {
    console.log('New lead created:', { lead, customer });
    // Implement notification logic (email, Slack, etc.)
  }

  private async handleHighPriorityLead(lead: any, customer: Customer): Promise<void> {
    console.log('High priority lead detected:', { lead, customer });
    // Implement high-priority lead handling
  }

  private async notifyAgentAssignment(lead: any, agent: any, customer: Customer): Promise<void> {
    console.log('Lead assigned to agent:', { lead, agent, customer });
    // Implement agent notification
  }

  private async scheduleCallback(customer: Customer, timing: string): Promise<void> {
    console.log('Scheduling callback:', { customer, timing });
    // Implement callback scheduling
  }

  private async scheduleSiteVisit(customer: Customer): Promise<void> {
    console.log('Scheduling site visit:', { customer });
    // Implement site visit scheduling
  }

  private async sendPropertyBrochure(customer: Customer): Promise<void> {
    console.log('Sending property brochure:', { customer });
    // Implement brochure sending
  }

  private async handleUrgentLead(customer: Customer): Promise<void> {
    console.log('Handling urgent lead:', { customer });
    // Implement urgent lead handling
  }

  private async createQualifiedLead(customer: Customer, extractedInfo: any): Promise<void> {
    if (!supabase) return;

    const leadData = {
      customer_id: customer.id,
      company_id: customer.company_id,
      source: 'whatsapp' as const,
      stage: 'qualified' as const,
      score: 85, // High score for AI-qualified leads
      requirements: extractedInfo,
      notes: 'AI-qualified lead with complete requirements',
      status: 'active' as const,
    };

    await supabase.from('leads').insert([leadData]);
  }

  private async searchAndSendProperties(customer: Customer, requirements: any): Promise<void> {
    console.log('Searching and sending properties:', { customer, requirements });
    // Implement property search and sending
  }
}

export const leadAutomationService = new LeadAutomationService();