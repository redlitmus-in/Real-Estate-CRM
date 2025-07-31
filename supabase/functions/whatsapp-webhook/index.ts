import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
            caption?: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    
    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully')
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      } else {
        console.log('Webhook verification failed')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    // Handle webhook payload (POST request)
    if (req.method === 'POST') {
      const payload: WhatsAppWebhookPayload = await req.json()
      
      console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2))

      // Process each entry in the webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const { messages, contacts } = change.value
            
            if (messages) {
              for (const message of messages) {
                await processIncomingMessage(supabase, message, contacts)
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processIncomingMessage(
  supabase: any,
  message: any,
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
) {
  try {
    const phoneNumber = message.from
    const contactInfo = contacts?.find(c => c.wa_id === phoneNumber)
    const customerName = contactInfo?.profile.name || 'Unknown Customer'

    console.log('Processing message from:', phoneNumber, 'Name:', customerName)

    // Find or create customer
    const customer = await findOrCreateCustomer(supabase, phoneNumber, customerName)
    
    // Find or create conversation
    const conversation = await findOrCreateConversation(supabase, customer.id, phoneNumber)
    
    // Save message
    await saveMessage(supabase, conversation.id, message)
    
    // Check if auto lead creation is enabled
    const autoLeadCreation = Deno.env.get('AUTO_LEAD_CREATION') === 'true'
    if (autoLeadCreation) {
      await createLeadIfNeeded(supabase, customer, message)
    }
    
    // Process with AI agent if enabled
    const aiAgentEnabled = Deno.env.get('AI_AGENT_ENABLED') === 'true'
    if (aiAgentEnabled) {
      await processWithAIAgent(supabase, customer, conversation, message)
    }
    
  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

async function findOrCreateCustomer(supabase: any, phoneNumber: string, name: string) {
  // Try to find existing customer by WhatsApp number
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('whatsapp_number', phoneNumber)
    .single()

  if (existingCustomer) {
    return existingCustomer
  }

  // Create new customer
  const newCustomer = {
    name,
    phone: phoneNumber,
    whatsapp_number: phoneNumber,
    source: 'whatsapp',
    lead_score: 50,
    tags: ['whatsapp-lead'],
    status: 'active',
    company_id: await getDefaultCompanyId(supabase),
    preferences: {
      preferred_contact_method: 'whatsapp',
      language: 'en',
    },
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert([newCustomer])
    .select()
    .single()

  if (error) throw error
  return customer
}

async function findOrCreateConversation(supabase: any, customerId: string, phoneNumber: string) {
  const platformConversationId = `wa_${phoneNumber}`

  // Try to find existing conversation
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('platform', 'whatsapp')
    .eq('platform_conversation_id', platformConversationId)
    .single()

  if (existingConversation) {
    return existingConversation
  }

  // Create new conversation
  const newConversation = {
    customer_id: customerId,
    platform: 'whatsapp',
    platform_conversation_id: platformConversationId,
    company_id: await getDefaultCompanyId(supabase),
    status: 'active',
    last_message_at: new Date().toISOString(),
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert([newConversation])
    .select()
    .single()

  if (error) throw error
  return conversation
}

async function saveMessage(supabase: any, conversationId: string, message: any) {
  const messageData = {
    conversation_id: conversationId,
    platform_message_id: message.id,
    sender_type: 'customer',
    content: message.text?.body || getMessageContent(message),
    message_type: message.type,
    media_urls: extractMediaUrls(message),
    metadata: {
      whatsapp_timestamp: message.timestamp,
      message_type: message.type,
      from: message.from,
    },
    status: 'delivered',
  }

  const { error } = await supabase.from('messages').insert([messageData])
  if (error) throw error
}

async function createLeadIfNeeded(supabase: any, customer: any, message: any) {
  const messageContent = message.text?.body?.toLowerCase() || ''
  
  // Keywords that indicate property interest
  const propertyKeywords = [
    'property', 'apartment', 'villa', 'plot', 'house', 'flat',
    'buy', 'purchase', 'invest', 'rent', 'lease',
    'bhk', '2bhk', '3bhk', '4bhk',
    'budget', 'price', 'cost',
    'location', 'area', 'locality'
  ]

  const hasPropertyInterest = propertyKeywords.some(keyword => 
    messageContent.includes(keyword)
  )

  if (hasPropertyInterest) {
    // Check if lead already exists for this customer
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single()

    if (!existingLead) {
      // Create new lead
      const leadData = {
        customer_id: customer.id,
        company_id: customer.company_id,
        source: 'whatsapp',
        stage: 'new',
        score: calculateLeadScore(messageContent),
        requirements: extractRequirements(messageContent),
        notes: `Auto-created from WhatsApp message: "${message.text?.body}"`,
        status: 'active',
      }

      const { error } = await supabase.from('leads').insert([leadData])
      if (error) {
        console.error('Error creating lead:', error)
      } else {
        console.log('Lead created automatically for customer:', customer.id)
      }
    }
  }
}

async function processWithAIAgent(supabase: any, customer: any, conversation: any, message: any) {
  // This would integrate with your AI agent service
  console.log('Processing with AI agent:', { customer: customer.id, conversation: conversation.id, message: message.id })
  
  // For now, send a simple auto-reply
  const autoReply = generateAutoReply(message.text?.body || '')
  
  if (autoReply) {
    await sendWhatsAppMessage(customer.whatsapp_number, autoReply)
    
    // Save AI response as message
    await supabase.from('messages').insert([{
      conversation_id: conversation.id,
      platform_message_id: `ai_${Date.now()}`,
      sender_type: 'system',
      content: autoReply,
      message_type: 'text',
      status: 'sent',
      metadata: { ai_generated: true },
    }])
  }
}

function generateAutoReply(messageContent: string): string | null {
  const content = messageContent.toLowerCase()
  
  if (content.includes('hi') || content.includes('hello')) {
    return "Hello! Welcome to our real estate services. I'm here to help you find your perfect property. What type of property are you looking for?"
  }
  
  if (content.includes('property') || content.includes('apartment') || content.includes('villa')) {
    return "Great! I'd love to help you find the perfect property. Could you tell me:\n1. Your budget range\n2. Preferred location\n3. Property type (apartment/villa/plot)\n4. BHK requirements"
  }
  
  if (content.includes('budget') || content.includes('price')) {
    return "Thank you for sharing your budget. Could you also let me know your preferred location and property type? This will help me find the best options for you."
  }
  
  return "Thank you for your message! I'm here to help you with all your real estate needs. Our team will get back to you shortly with the best property options."
}

async function sendWhatsAppMessage(to: string, message: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  if (!accessToken || !phoneNumberId) {
    console.error('WhatsApp credentials not configured')
    return
  }
  
  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }

    console.log('Auto-reply sent successfully')
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}

// Helper functions
function getMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || ''
    case 'image':
      return message.image?.caption || '[Image]'
    case 'location':
      return `[Location: ${message.location?.name || 'Shared location'}]`
    default:
      return `[${message.type.toUpperCase()}]`
  }
}

function extractMediaUrls(message: any): string[] {
  const urls: string[] = []
  
  if (message.image?.id) {
    urls.push(`https://graph.facebook.com/v18.0/${message.image.id}`)
  }
  
  return urls
}

function calculateLeadScore(content: string): number {
  let score = 50 // Base score

  // Increase score for specific keywords
  if (content.includes('budget')) score += 15
  if (content.includes('buy') || content.includes('purchase')) score += 20
  if (content.includes('urgent') || content.includes('immediate')) score += 10
  if (content.includes('loan') || content.includes('finance')) score += 10
  if (content.match(/\d+\s*bhk/i)) score += 15

  return Math.min(score, 100)
}

function extractRequirements(content: string): Record<string, any> {
  const requirements: Record<string, any> = {}
  
  // Extract BHK type
  const bhkMatch = content.match(/(\d+)\s*bhk/i)
  if (bhkMatch) {
    requirements.bhk_type = `${bhkMatch[1]}BHK`
  }

  // Extract budget
  const budgetMatch = content.match(/budget.*?(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i)
  if (budgetMatch) {
    const amount = parseFloat(budgetMatch[1])
    const unit = budgetMatch[2].toLowerCase()
    requirements.budget_max = unit.startsWith('cr') ? amount * 10000000 : amount * 100000
    requirements.budget_min = requirements.budget_max * 0.8
  }

  // Extract location
  const locationKeywords = ['in', 'at', 'near', 'around']
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}\\s+([a-zA-Z\\s]+?)(?:\\s|$|,|\\.)`, 'i')
    const match = content.match(regex)
    if (match) {
      requirements.preferred_location = match[1].trim()
      break
    }
  }

  return requirements
}

async function getDefaultCompanyId(supabase: any): Promise<string> {
  // Get the first active company as default
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('status', 'active')
    .limit(1)
    .single()
  
  return company?.id || '00000000-0000-0000-0000-000000000003'
}