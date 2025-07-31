import { aiAgentService } from './aiAgentService';
import { Customer, Message } from '../types';

export class TelegramService {
  private botToken: string;
  private webhookUrl: string;

  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    this.webhookUrl = import.meta.env.VITE_TELEGRAM_WEBHOOK_URL || '';
  }

  async processWithAIAgent(
    customer: Customer,
    conversationId: string,
    messageContent: string,
    messageHistory: Message[] = []
  ): Promise<string> {
    try {
      console.log('Processing Telegram message with AI agent:', {
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
      console.error('Error processing Telegram message with AI:', error);
      return "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment.";
    }
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.botToken) {
      console.error('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async setWebhook(url: string): Promise<boolean> {
    if (!this.botToken) {
      console.error('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      return false;
    }
  }

  async getWebhookInfo(): Promise<any> {
    if (!this.botToken) {
      console.error('Telegram bot token not configured');
      return null;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`);
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Telegram webhook info:', error);
      return null;
    }
  }
}

export const telegramService = new TelegramService();