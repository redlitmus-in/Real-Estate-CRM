import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Conversation, Message } from '../types';
import toast from 'react-hot-toast';
import { aiAgentService } from '../services/aiAgentService';
import { telegramService } from '../services/telegramService';

// Conversations Management
export const useConversations = (companyId?: string) => {
  console.log('useConversations called with companyId:', companyId);
  
  const result = useQuery({
    queryKey: ['conversations', companyId],
    queryFn: async () => {
      console.log('useConversations queryFn executing...');
      
      if (!supabase) {
        console.warn('Supabase not configured, returning empty array');
        return [];
      }

      // Use the correct company ID from the database
      const actualCompanyId = companyId || '550e8400-e29b-41d4-a716-446655440001';
      
      console.log('useConversations - actualCompanyId:', actualCompanyId);
      console.log('useConversations - supabase client:', !!supabase);

      // First get conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:customers(name, phone, email, whatsapp_number, telegram_id, telegram_username)
        `)
        .eq('company_id', actualCompanyId)
        .order('last_message_at', { ascending: false });

      console.log('useConversations - raw query result:', { conversations, error });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      console.log('useConversations - conversations before processing:', conversations);

      // Then get the last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversations?.map(async (conv) => {
          console.log('Processing conversation:', conv.id);
          
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, read_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .is('read_at', null)
            .eq('sender_type', 'customer');

          const result = {
            ...conv,
            last_message: lastMessage?.content || 'No messages yet',
            unread_count: unreadMessages?.length || 0
          };
          
          console.log('Processed conversation:', result);
          return result;
        }) || []
      );
      
      console.log('Fetched conversations with last messages:', conversationsWithLastMessage);
      return conversationsWithLastMessage;
    },
    enabled: !!companyId || !!supabase,
  });
  
  console.log('useConversations enabled:', !!companyId || !!supabase);
  return result;
};

export const useMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!supabase) {
        console.warn('Supabase not configured, returning empty array');
        return [];
      }

      if (!conversationId) {
        console.warn('No conversation ID provided');
        return [];
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages for conversation', conversationId, ':', data);
      return data as Message[] || [];
    },
    enabled: !!conversationId && !!supabase,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageData: {
      conversation_id: string;
      content: string;
      message_type?: 'text' | 'image' | 'document';
      media_urls?: string[];
    }) => {
      console.log('useSendMessage - sending message:', messageData);
      
      if (!supabase) {
        console.warn('Supabase not configured, cannot send message');
        throw new Error('Database not connected. Please configure Supabase to send messages.');
      }

      // Generate a proper UUID for sender_id instead of hardcoded '1'
      const senderId = crypto.randomUUID();
      
      console.log('useSendMessage - using sender_id:', senderId);

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          ...messageData,
          platform_message_id: `msg_${Date.now()}`,
          sender_type: 'customer',
          sender_id: senderId,
          message_type: messageData.message_type || 'text',
          media_urls: messageData.media_urls || [],
          metadata: {},
          status: 'sent',
        }])
        .select()
        .single();

      console.log('useSendMessage - insert result:', { data, error });

      if (error) {
        console.error('useSendMessage - error:', error);
        throw error;
      }

      // Get conversation details for platform-specific delivery
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', messageData.conversation_id)
        .single();

      // Platform-specific message delivery
      if (conversation) {
        try {
          // Telegram delivery
          if (conversation.platform === 'telegram' && conversation.platform_conversation_id) {
            console.log('useSendMessage - delivering to Telegram:', {
              platform_conversation_id: conversation.platform_conversation_id,
              content: messageData.content
            });
            
            // Extract chat ID from platform_conversation_id (format: tg_123456789)
            const chatId = conversation.platform_conversation_id.replace('tg_', '');
            
            if (chatId) {
              const telegramDeliveryResult = await telegramService.sendMessage(chatId, messageData.content);
              console.log('useSendMessage - Telegram delivery result:', telegramDeliveryResult);
              
              if (!telegramDeliveryResult) {
                console.warn('useSendMessage - Telegram delivery failed, but message saved to database');
                // Don't throw error - message is saved, just delivery failed
              }
            } else {
              console.warn('useSendMessage - Could not extract Telegram chat ID from:', conversation.platform_conversation_id);
            }
          }
          
          // WhatsApp delivery (future implementation)
          // if (conversation.platform === 'whatsapp') {
          //   // WhatsApp delivery logic
          // }
          
          // Facebook delivery (future implementation)
          // if (conversation.platform === 'facebook') {
          //   // Facebook delivery logic
          // }
          
        } catch (deliveryError) {
          console.error('useSendMessage - platform delivery error:', deliveryError);
          // Don't throw error - message is saved to database, just delivery failed
          // Could show a warning toast here if needed
        }
      }

      // Trigger AI processing after saving the message
      try {
        console.log('useSendMessage - triggering AI processing');
        
        if (conversation && conversation.customer) {
          // Get message history for context
          const { data: messageHistory } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', messageData.conversation_id)
            .order('created_at', { ascending: true })
            .limit(10);

          // Process with AI agent
          const aiResponse = await aiAgentService.processMessage(
            conversation.customer,
            messageData.conversation_id,
            messageData.content,
            messageHistory || []
          );

          console.log('useSendMessage - AI response:', aiResponse);

          // Save AI response if generated
          if (aiResponse.message) {
            const { data: aiMessage, error: aiError } = await supabase
              .from('messages')
              .insert([{
                conversation_id: messageData.conversation_id,
                platform_message_id: `ai_${Date.now()}`,
                sender_type: 'system',
                content: aiResponse.message,
                message_type: 'text',
                status: 'sent',
                metadata: { 
                  ai_generated: true, 
                  platform: 'crm',
                  stage: aiResponse.nextStage,
                  actions: aiResponse.actions,
                  confidence: aiResponse.confidence || 0.8,
                  extracted_info: aiResponse.extractedInfo
                },
              }])
              .select()
              .single();

            console.log('useSendMessage - AI message saved:', { aiMessage, aiError });
            
            // Deliver AI response to Telegram if applicable
            if (conversation.platform === 'telegram' && conversation.platform_conversation_id) {
              try {
                const chatId = conversation.platform_conversation_id.replace('tg_', '');
                if (chatId) {
                  await telegramService.sendMessage(chatId, aiResponse.message);
                  console.log('useSendMessage - AI response delivered to Telegram');
                }
              } catch (aiDeliveryError) {
                console.error('useSendMessage - AI response Telegram delivery error:', aiDeliveryError);
              }
            }
          }
        }
      } catch (aiError) {
        console.error('useSendMessage - AI processing error:', aiError);
        // Don't throw error - AI processing is optional
      }
      
      return data as Message;
    },
    onMutate: async (messageData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['messages', messageData.conversation_id] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', messageData.conversation_id]);

      // Optimistically update to the new value
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: messageData.conversation_id,
        platform_message_id: `temp_${Date.now()}`,
        sender_type: 'customer' as const,
        sender_id: null,
        content: messageData.content,
        message_type: messageData.message_type || 'text' as const,
        media_urls: messageData.media_urls || [],
        metadata: {},
        delivered_at: null,
        read_at: null,
        created_at: new Date().toISOString(),
        status: 'sending' as const,
      };

      queryClient.setQueryData(['messages', messageData.conversation_id], (old: any) => {
        return [...(old || []), optimisticMessage];
      });

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (error: any, messageData, context) => {
      console.error('useSendMessage - error:', error);
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['messages', messageData.conversation_id], context?.previousMessages);
      toast.error(error.message || 'Failed to send message');
    },
    onSuccess: (data) => {
      console.log('useSendMessage - success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Message sent successfully!');
    },
    onSettled: (data, error, messageData) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['messages', messageData.conversation_id] });
    },
  });
};

// Mark messages as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!supabase) {
        throw new Error('Database not connected');
      }

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .is('read_at', null)
        .eq('sender_type', 'customer'); // Only mark customer messages as read

      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      console.log('Messages marked as read for conversation:', conversationId);
      // Update both messages and conversations queries
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    },
  });
};

// Messaging Statistics
export const useMessagingStats = (companyId?: string) => {
  return useQuery({
    queryKey: ['messaging-stats', companyId],
    queryFn: async () => {
      if (!supabase) {
        console.warn('Supabase not configured, returning default stats');
        return {
          totalConversations: 0,
          activeConversations: 0,
          unreadMessages: 0,
          todayMessages: 0,
          responseTime: 0,
          byPlatform: {
            whatsapp: 0,
            facebook: 0,
            viber: 0,
            telegram: 0,
          },
          thisWeek: {
            messages: 0,
            conversations: 0,
            responseRate: 0,
          },
        };
      }

      // Use the correct company ID from the database
      const actualCompanyId = companyId || '550e8400-e29b-41d4-a716-446655440001';
      
      console.log('useMessagingStats - actualCompanyId:', actualCompanyId);

      // Get conversations count
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, platform, status, created_at')
        .eq('company_id', actualCompanyId);

      console.log('useMessagingStats - conversations query result:', { conversations, convError });

      if (convError) {
        console.error('Error fetching conversations for stats:', convError);
        throw convError;
      }

      // Get messages count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayMessages, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .gte('created_at', today.toISOString());

      if (msgError) {
        console.error('Error fetching today messages:', msgError);
      }

      const stats = {
        totalConversations: conversations?.length || 0,
        activeConversations: conversations?.filter(c => c.status === 'active').length || 0,
        unreadMessages: 0, // Would need to calculate from messages with read_at = null
        todayMessages: todayMessages?.length || 0,
        responseTime: 15, // Default response time
        byPlatform: {
          whatsapp: conversations?.filter(c => c.platform === 'whatsapp').length || 0,
          facebook: conversations?.filter(c => c.platform === 'facebook').length || 0,
          viber: conversations?.filter(c => c.platform === 'viber').length || 0,
          telegram: conversations?.filter(c => c.platform === 'telegram').length || 0,
        },
        thisWeek: {
          messages: todayMessages?.length || 0,
          conversations: conversations?.length || 0,
          responseRate: 94.5, // Default response rate
        },
      };

      console.log('Calculated messaging stats:', stats);
      return stats;
    },
    enabled: !!companyId || !!supabase,
  });
};