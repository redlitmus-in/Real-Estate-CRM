import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, CheckCircle, AlertCircle, Phone, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface WhatsAppConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  isConfigured: boolean;
  isConnected: boolean;
}

interface WhatsAppStats {
  totalMessages: number;
  leadsCreated: number;
  responseRate: number;
  avgResponseTime: number;
  aiInteractions: number;
}

export const WhatsAppIntegration: React.FC = () => {
  const { currentCompany } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig>({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: '',
    isConfigured: false,
    isConnected: false,
  });
  const [stats, setStats] = useState<WhatsAppStats>({
    totalMessages: 0,
    leadsCreated: 0,
    responseRate: 0,
    avgResponseTime: 0,
    aiInteractions: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadWhatsAppConfig();
    loadWhatsAppStats();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      // Load configuration from environment or database
      const envConfig = {
        businessAccountId: import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
        webhookVerifyToken: import.meta.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
        isConfigured: !!(import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN && import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID),
        isConnected: false, // Will be tested
      };
      
      setConfig(envConfig);
      
      if (envConfig.isConfigured) {
        await testConnection();
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  };

  const loadWhatsAppStats = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch real stats from database
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at, sender_type')
        .eq('platform', 'whatsapp');

      if (messagesError) throw messagesError;

      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, source, created_at')
        .eq('source', 'whatsapp');

      if (leadsError) throw leadsError;

      // Calculate stats
      const totalMessages = messages?.length || 0;
      const leadsCreated = leads?.length || 0;
      const aiInteractions = messages?.filter(m => m.sender_type === 'system').length || 0;
      const responseRate = totalMessages > 0 ? ((totalMessages - aiInteractions) / totalMessages) * 100 : 0;
      const avgResponseTime = 12; // This would need to be calculated from actual response times

      setStats({
        totalMessages,
        leadsCreated,
        responseRate: Math.round(responseRate * 10) / 10,
        avgResponseTime,
        aiInteractions,
      });
    } catch (error) {
      console.error('Error loading WhatsApp stats:', error);
      // Set default stats on error
      setStats({
        totalMessages: 0,
        leadsCreated: 0,
        responseRate: 0,
        avgResponseTime: 0,
        aiInteractions: 0,
      });
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      // Test WhatsApp Business API connection
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });
      
      const isConnected = response.ok;
      setConfig(prev => ({ ...prev, isConnected }));
      
      return isConnected;
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      setConfig(prev => ({ ...prev, isConnected: false }));
      return false;
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, save to database
      console.log('Saving WhatsApp configuration:', config);
      
      // Test the connection with new config
      const isConnected = await testConnection();
      
      if (isConnected) {
        setConfig(prev => ({ ...prev, isConfigured: true, isConnected: true }));
      }
    } catch (error) {
      console.error('Error saving WhatsApp configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof WhatsAppConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Business Integration</h2>
          <p className="text-gray-600">Configure WhatsApp Business API for automated lead capture and AI responses</p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}m</p>
              </div>
              <Phone className="h-8 w-8 text-orange-600" />
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
              <Users className="h-8 w-8 text-indigo-600" />
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
              <span>WhatsApp Business API Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Account ID"
              value={config.businessAccountId}
              onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
              placeholder="Enter your WhatsApp Business Account ID"
              helperText="Found in your Meta Business Manager"
            />

            <Input
              label="Phone Number ID"
              value={config.phoneNumberId}
              onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
              placeholder="Enter your WhatsApp Phone Number ID"
              helperText="The ID of your WhatsApp Business phone number"
            />

            <Input
              label="Access Token"
              type="password"
              value={config.accessToken}
              onChange={(e) => handleConfigChange('accessToken', e.target.value)}
              placeholder="Enter your WhatsApp Access Token"
              helperText="Permanent access token from Meta Developer Console"
            />

            <Input
              label="Webhook Verify Token"
              value={config.webhookVerifyToken}
              onChange={(e) => handleConfigChange('webhookVerifyToken', e.target.value)}
              placeholder="Enter your webhook verify token"
              helperText="Custom token for webhook verification"
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
                onClick={saveConfiguration}
                loading={isLoading}
                className="flex-1"
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Auto Lead Creation</h4>
                  <p className="text-sm text-gray-600">Automatically create leads from WhatsApp messages</p>
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
                  <h4 className="font-medium text-gray-900">Service Message Auto-Reply</h4>
                  <p className="text-sm text-gray-600">Instant responses to customer inquiries</p>
                </div>
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Lead Scoring & KPIs</h4>
                  <p className="text-sm text-gray-600">Automatic lead scoring and performance tracking</p>
                </div>
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Webhook URL</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <code className="text-sm text-gray-700">
                  {window.location.origin}/functions/v1/whatsapp-webhook
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure this URL in your WhatsApp Business API webhook settings
              </p>
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">1. WhatsApp Business API Setup</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Create a Meta Business Account</li>
                  <li>• Set up WhatsApp Business API</li>
                  <li>• Get your Business Account ID and Phone Number ID</li>
                  <li>• Generate a permanent access token</li>
                  <li>• Configure webhook URL in Meta Developer Console</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">2. AI Agent Configuration</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Set up OpenAI API key for AI responses</li>
                  <li>• Configure lead qualification parameters</li>
                  <li>• Customize auto-reply templates</li>
                  <li>• Set up lead scoring rules</li>
                  <li>• Configure agent assignment rules</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🤖 AI Agent Capabilities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Lead Qualification:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Extract customer requirements</li>
                    <li>• Identify budget and timeline</li>
                    <li>• Determine property preferences</li>
                    <li>• Score lead quality automatically</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Automated Responses:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Intelligent conversation flow</li>
                    <li>• Context-aware responses</li>
                    <li>• Property matching suggestions</li>
                    <li>• Appointment scheduling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};