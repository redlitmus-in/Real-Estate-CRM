import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, CheckCircle, AlertCircle, Bot, Users, Target, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { telegramService } from '../services/telegramService';

interface TelegramConfig {
  botToken: string;
  webhookUrl: string;
  webhookSecret: string;
  isConfigured: boolean;
  isConnected: boolean;
  botUsername?: string;
  botName?: string;
}

interface TelegramStats {
  totalMessages: number;
  leadsCreated: number;
  responseRate: number;
  avgResponseTime: number;
  aiInteractions: number;
  activeChats: number;
}

export const TelegramIntegration: React.FC = () => {
  const { currentCompany } = useAuth();
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    webhookUrl: '',
    webhookSecret: '',
    isConfigured: false,
    isConnected: false,
  });
  const [stats, setStats] = useState<TelegramStats>({
    totalMessages: 0,
    leadsCreated: 0,
    responseRate: 0,
    avgResponseTime: 0,
    aiInteractions: 0,
    activeChats: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);

  useEffect(() => {
    loadTelegramConfig();
    loadTelegramStats();
  }, []);

  const loadTelegramConfig = async () => {
    try {
      // Load configuration from environment or database
      const envConfig = {
        botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
        webhookUrl: import.meta.env.VITE_TELEGRAM_WEBHOOK_URL || '',
        webhookSecret: import.meta.env.VITE_TELEGRAM_WEBHOOK_SECRET || '',
        isConfigured: !!(import.meta.env.VITE_TELEGRAM_BOT_TOKEN && import.meta.env.VITE_TELEGRAM_WEBHOOK_URL),
        isConnected: false, // Will be tested
      };
      
      setConfig(envConfig);
      
      if (envConfig.isConfigured) {
        await testConnection();
      }
    } catch (error) {
      console.error('Error loading Telegram config:', error);
    }
  };

  const loadTelegramStats = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch real stats from database
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at, sender_type')
        .eq('platform', 'telegram');

      if (messagesError) throw messagesError;

      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, source, created_at')
        .eq('source', 'telegram');

      if (leadsError) throw leadsError;

      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('platform', 'telegram')
        .eq('status', 'active');

      if (conversationsError) throw conversationsError;

      // Calculate stats
      const totalMessages = messages?.length || 0;
      const leadsCreated = leads?.length || 0;
      const aiInteractions = messages?.filter(m => m.sender_type === 'system').length || 0;
      const responseRate = totalMessages > 0 ? ((totalMessages - aiInteractions) / totalMessages) * 100 : 0;
      const activeChats = conversations?.length || 0;
      const avgResponseTime = 8; // This would need to be calculated from actual response times

      setStats({
        totalMessages,
        leadsCreated,
        responseRate: Math.round(responseRate * 10) / 10,
        avgResponseTime,
        aiInteractions,
        activeChats,
      });
    } catch (error) {
      console.error('Error loading Telegram stats:', error);
      // Set default stats on error
      setStats({
        totalMessages: 0,
        leadsCreated: 0,
        responseRate: 0,
        avgResponseTime: 0,
        aiInteractions: 0,
        activeChats: 0,
      });
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      // Test Telegram Bot API connection
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
      const result = await response.json();
      
      const isConnected = result.ok;
      setConfig(prev => ({ 
        ...prev, 
        isConnected,
        botUsername: result.result?.username,
        botName: result.result?.first_name,
      }));
      
      return isConnected;
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      setConfig(prev => ({ ...prev, isConnected: false }));
      return false;
    } finally {
      setTestingConnection(false);
    }
  };

  const setupWebhook = async () => {
    setSettingWebhook(true);
    try {
      const success = await telegramService.setupWebhook();
      if (success) {
        setConfig(prev => ({ ...prev, isConnected: true }));
      }
      return success;
    } catch (error) {
      console.error('Error setting up webhook:', error);
      return false;
    } finally {
      setSettingWebhook(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, save to database
      console.log('Saving Telegram configuration:', config);
      
      // Test the connection with new config
      const isConnected = await testConnection();
      
      if (isConnected) {
        setConfig(prev => ({ ...prev, isConfigured: true, isConnected: true }));
        
        // Set up webhook
        await setupWebhook();
      }
    } catch (error) {
      console.error('Error saving Telegram configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof TelegramConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Telegram Bot Integration</h2>
          <p className="text-gray-600">Configure Telegram Bot for automated lead capture and AI responses</p>
        </div>
        <div className="flex items-center space-x-4">
          {config.botUsername && (
            <div className="text-sm text-gray-600">
              Bot: @{config.botUsername}
            </div>
          )}
          <div className="flex items-center space-x-2">
            {config.isConnected ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Not Connected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Created</p>
                <p className="text-2xl font-bold text-gray-900">{stats.leadsCreated}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}s</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Interactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aiInteractions}</p>
              </div>
              <Bot className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
              </div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Telegram Bot Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Bot Token"
              type="password"
              value={config.botToken}
              onChange={(e) => handleConfigChange('botToken', e.target.value)}
              placeholder="Enter your Telegram Bot Token"
              helperText="Get this from @BotFather on Telegram"
            />

            <Input
              label="Webhook URL"
              value={config.webhookUrl}
              onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
              placeholder="https://your-domain.com/functions/v1/telegram-webhook"
              helperText="Your Supabase Edge Function URL"
            />

            <Input
              label="Webhook Secret"
              value={config.webhookSecret}
              onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
              placeholder="Enter a secure webhook secret"
              helperText="Custom secret for webhook verification"
            />

            <div className="flex space-x-2">
              <Button
                onClick={testConnection}
                variant="outline"
                loading={testingConnection}
                className="flex-1"
              >
                Test Connection
              </Button>
              <Button
                onClick={setupWebhook}
                variant="outline"
                loading={settingWebhook}
                className="flex-1"
              >
                Setup Webhook
              </Button>
            </div>

            <Button
              onClick={saveConfiguration}
              loading={isLoading}
              className="w-full"
            >
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Features & Bot Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Features & Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Auto Lead Creation</h4>
                  <p className="text-sm text-gray-600">Automatically create leads from Telegram messages</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">AI Agent Responses</h4>
                  <p className="text-sm text-gray-600">Intelligent responses with lead qualification</p>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Interactive Keyboards</h4>
                  <p className="text-sm text-gray-600">Inline buttons for better user experience</p>
                </div>
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Media Support</h4>
                  <p className="text-sm text-gray-600">Handle photos, documents, audio, and video</p>
                </div>
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Bot Commands</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">/start</code>
                  <span className="text-gray-600">Welcome message & property selection</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">/help</code>
                  <span className="text-gray-600">Show available commands</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">/properties</code>
                  <span className="text-gray-600">Browse available properties</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-gray-100 px-2 py-1 rounded">/contact</code>
                  <span className="text-gray-600">Get contact information</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">1. Create Telegram Bot</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Open Telegram and search for @BotFather</li>
                  <li>• Send /newbot command</li>
                  <li>• Choose a name and username for your bot</li>
                  <li>• Copy the bot token provided</li>
                  <li>• Set bot commands using /setcommands</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">2. Configure Webhook</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Deploy the Supabase Edge Function</li>
                  <li>• Set environment variables in Supabase</li>
                  <li>• Configure webhook URL and secret</li>
                  <li>• Test the webhook connection</li>
                  <li>• Enable bot features and AI responses</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🤖 Telegram Bot Capabilities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Message Handling:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Text messages with NLP processing</li>
                    <li>• Photo and document uploads</li>
                    <li>• Audio and video messages</li>
                    <li>• Location sharing support</li>
                    <li>• Contact information extraction</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Interactive Features:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Inline keyboard buttons</li>
                    <li>• Custom reply keyboards</li>
                    <li>• Callback query handling</li>
                    <li>• Multi-step conversation flows</li>
                    <li>• Rich media responses</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">📋 Environment Variables</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div><code>VITE_TELEGRAM_BOT_TOKEN</code> - Your bot token from @BotFather</div>
                <div><code>VITE_TELEGRAM_WEBHOOK_URL</code> - Your webhook endpoint URL</div>
                <div><code>VITE_TELEGRAM_WEBHOOK_SECRET</code> - Secret for webhook verification</div>
                <div><code>VITE_TELEGRAM_ENABLED</code> - Enable/disable Telegram integration</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};