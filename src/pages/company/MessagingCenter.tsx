import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import MessageContent from '../../components/ui/MessageContent';
import { useConversations, useMessages, useSendMessage, useMessagingStats, useMarkAsRead } from '../../hooks/useMessaging';
import { useAuth } from '../../store/authStore';
import { formatDateTime, getInitials } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const MessagingCenter: React.FC = () => {
  const { currentCompany } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the correct company ID - fallback to the database company ID if currentCompany is not set
  const companyId = currentCompany?.id || '550e8400-e29b-41d4-a716-446655440001';
  
  console.log('MessagingCenter - currentCompany:', currentCompany);
  console.log('MessagingCenter - using companyId:', companyId);

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(companyId);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(selectedConversation || undefined);
  const { data: stats } = useMessagingStats(companyId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const queryClient = useQueryClient();

  console.log('MessagingCenter - conversations:', conversations);
  console.log('MessagingCenter - stats:', stats);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when selected conversation changes (for direct navigation/refresh)
  useEffect(() => {
    if (selectedConversation && !markAsReadMutation.isPending) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('Testing Supabase connection...');
      console.log('Supabase client:', !!supabase);
      console.log('Company ID:', companyId);
      
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .limit(1);
          console.log('Connection test result:', { data, error });
          
          if (error) {
            console.error('Connection test error:', error);
          } else {
            console.log('Connection test success, found conversations:', data?.length || 0);
          }
        } catch (err) {
          console.error('Connection test error:', err);
        }
      } else {
        console.error('Supabase client not available');
      }
    };
    
    testConnection();
  }, [companyId]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' || conv.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    console.log('handleSendMessage - messageText:', messageText);
    console.log('handleSendMessage - selectedConversation:', selectedConversation);

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: selectedConversation,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (error) {
      console.error('handleSendMessage - error:', error);
      // Error handled in mutation
    }
  };

  // Handle conversation selection with read marking
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    markAsReadMutation.mutate(conversationId);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      whatsapp: '📱',
      facebook: '📘',
      viber: '💜',
      telegram: '✈️',
    };
    return icons[platform] || '💬';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-100 text-green-800',
      facebook: 'bg-blue-100 text-blue-800',
      viber: 'bg-purple-100 text-purple-800',
      telegram: 'bg-cyan-100 text-cyan-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const getMessageStatus = (message: any) => {
    if (message.status === 'read') return <CheckCheck className="h-4 w-4 text-blue-500" />;
    if (message.status === 'delivered') return <CheckCheck className="h-4 w-4 text-gray-500" />;
    if (message.status === 'sent') return <Check className="h-4 w-4 text-gray-500" />;
    return null;
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messaging Center</h1>
          <p className="text-gray-600">Manage conversations across all platforms</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                  <p className="text-sm text-green-600">of {stats.totalConversations} total</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                  <p className="text-sm text-orange-600">Needs attention</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.responseTime}m</p>
                  <p className="text-sm text-green-600">Average</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
                  <p className="text-sm text-blue-600">Sent & received</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Messaging Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="flex-1"
              />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Platforms</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="facebook">Facebook</option>
                <option value="viber">Viber</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getInitials(conversation.customer?.name || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {conversation.customer?.name || 'Unknown Customer'}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlatformColor(conversation.platform)}`}>
                              {getPlatformIcon(conversation.platform)} {conversation.platform}
                            </span>
                            {conversation.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse shadow-lg">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(conversation.last_message_at)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getInitials(selectedConv.customer?.name || 'Unknown')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedConv.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedConv.customer?.phone || selectedConv.customer?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === 'agent' || message.sender_type === 'customer' 
                              ? 'justify-end' 
                              : 'justify-start'
                          }`}
                        >
                          <div className={`max-w-2xl ${
                            message.sender_type === 'agent' || message.sender_type === 'customer'
                              ? 'ml-16' 
                              : 'mr-16'
                          }`}>
                            {/* Message bubble */}
                            <div
                              className={`px-6 py-4 rounded-2xl shadow-sm ${
                                message.sender_type === 'agent' || message.sender_type === 'customer'
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : message.sender_type === 'system'
                                  ? 'bg-white border border-gray-200 text-gray-900 shadow-md rounded-bl-md'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
                              } ${
                                message.status === 'sending' ? 'opacity-70' : ''
                              }`}
                            >
                              <MessageContent 
                                content={message.content || ''}
                                senderType={message.sender_type}
                              />
                              
                              {/* Message footer */}
                              <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                                message.sender_type === 'agent' || message.sender_type === 'customer'
                                  ? 'border-blue-500/20 text-blue-100' 
                                  : 'border-gray-200 text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatDateTime(message.created_at)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {message.status === 'sending' && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  {(message.sender_type === 'agent' || message.sender_type === 'customer') && message.status !== 'sending' && (
                                    <div className="ml-2">
                                      {getMessageStatus(message)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Sender label for system messages */}
                            {message.sender_type === 'system' && (
                              <div className="text-xs text-gray-500 mt-1 px-2">
                                🤖 AI Assistant
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t bg-white p-6">
                <div className="flex items-end space-x-4">
                  <Button variant="ghost" size="sm" className="mb-2">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  
                  <div className="flex-1">
                    <textarea
                      placeholder="Type your message here..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="w-full min-h-[44px] max-h-32 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={1}
                      style={{ 
                        resize: 'none',
                        overflow: 'hidden',
                        height: Math.min(Math.max(44, messageText.split('\n').length * 20 + 24), 128)
                      }}
                    />
                  </div>
                  
                  <Button variant="ghost" size="sm" className="mb-2">
                    <Smile className="h-5 w-5 text-gray-500" />
                  </Button>
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="mb-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {/* Typing indicator or helper text */}
                <div className="mt-2 text-xs text-gray-500 px-4">
                  Press Enter to send, Shift + Enter for new line
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};