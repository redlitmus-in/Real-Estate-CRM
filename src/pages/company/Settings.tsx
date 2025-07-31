import React, { useState } from 'react';
import { Settings as SettingsIcon, MessageSquare, Bot, Target, Bell, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { WhatsAppIntegration } from '../../components/WhatsAppIntegration';
import { TelegramIntegration } from '../../components/TelegramIntegration';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'telegram' | 'whatsapp' | 'ai' | 'notifications'>('telegram');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'telegram', label: 'Telegram Bot', icon: Send },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageSquare },
    { id: 'ai', label: 'AI Agent', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'telegram':
        return <TelegramIntegration />;
      
      case 'whatsapp':
        return <WhatsAppIntegration />;
      
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Agent Configuration</h2>
              <p className="text-gray-600">Configure your AI agent for automated lead qualification and responses</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Agent Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">🤖 AI Agent Features</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Intelligent lead qualification with state management</li>
                      <li>• Multi-stage conversation flows using Langchain & Langraph</li>
                      <li>• Automatic requirement extraction and lead scoring</li>
                      <li>• Context-aware responses based on customer history</li>
                      <li>• Property matching and recommendation engine</li>
                      <li>• Automated follow-up scheduling and agent assignment</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">📊 KPI Management</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• Real-time lead conversion tracking</li>
                      <li>• Response time and quality metrics</li>
                      <li>• Customer satisfaction scoring</li>
                      <li>• Agent performance analytics</li>
                      <li>• Revenue attribution and ROI tracking</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
              <p className="text-gray-600">Configure how you receive notifications about leads and messages</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Notification settings will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
              <p className="text-gray-600">Manage your company settings and preferences</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">General settings will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your CRM configuration and integrations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};