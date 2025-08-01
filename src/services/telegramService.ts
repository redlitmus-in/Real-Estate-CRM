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
      console.log('Sending Telegram message:', {
        chatId,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        botToken: this.botToken.substring(0, 10) + '...'
      });

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      };

      console.log('Telegram API payload:', payload);

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Telegram API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API error response:', errorText);
        throw new Error(`Telegram API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Telegram API response data:', data);
      
      if (!data.ok) {
        console.error('Telegram API returned error:', data);
        return false;
      }

      console.log('Telegram message sent successfully:', {
        messageId: data.result?.message_id,
        chatId: data.result?.chat?.id,
        from: data.result?.from?.username
      });

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

  async getBotInfo(): Promise<any> {
    if (!this.botToken) {
      console.error('Telegram bot token not configured');
      return null;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Bot info:', data);
      return data;
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
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