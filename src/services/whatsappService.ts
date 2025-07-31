import { aiAgentService } from './aiAgentService';
import { Customer, Message } from '../types';

export class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_WHATSAPP_API_KEY || '';
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';
  }

  async processWithAIAgent(
    customer: Customer,
    conversationId: string,
    messageContent: string,
    messageHistory: Message[] = []
  ): Promise<string> {
    try {
      console.log('Processing WhatsApp message with AI agent:', {
        customerId: customer.id,
        conversationId,
        messageContent
      });

      // Process with AI agent
      const aiResponse = await aiAgentService.processMessage(
        customer,
        conversationId,
        messageContent,
        messageHistory
      );

      console.log('AI agent response:', aiResponse);

      return aiResponse.message;
    } catch (error) {
      console.error('Error processing WhatsApp message with AI:', error);
      return "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment.";
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.apiKey || !this.phoneNumberId) {
      console.error('WhatsApp API not configured');
      return false;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const data = await response.json();
      return !!data.messages;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendTemplateMessage(phoneNumber: string, templateName: string, language: string = 'en'): Promise<boolean> {
    if (!this.apiKey || !this.phoneNumberId) {
      console.error('WhatsApp API not configured');
      return false;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: language
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const data = await response.json();
      return !!data.messages;
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      return false;
    }
  }

  async getWebhookInfo(): Promise<any> {
    if (!this.apiKey || !this.phoneNumberId) {
      console.error('WhatsApp API not configured');
      return null;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}?fields=webhook_url`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting WhatsApp webhook info:', error);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();