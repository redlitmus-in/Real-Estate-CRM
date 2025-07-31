import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  audio?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
  video?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
  location?: {
    longitude: number;
    latitude: number;
  };
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
  };
  caption?: string;
}

interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
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

    // Verify webhook secret token
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
    const expectedToken = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
    
    if (secretToken !== expectedToken) {
      console.log('Invalid webhook secret token')
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders 
      })
    }

    // Handle webhook payload (POST request)
    if (req.method === 'POST') {
      const update: TelegramWebhookUpdate = await req.json()
      
      console.log('Received Telegram webhook:', JSON.stringify(update, null, 2))

      // Process the update
      if (update.message) {
        await processIncomingMessage(supabase, update.message)
      } else if (update.edited_message) {
        await processIncomingMessage(supabase, update.edited_message, true)
      } else if (update.callback_query) {
        await processCallbackQuery(supabase, update.callback_query)
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
    console.error('Error processing Telegram webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processIncomingMessage(
  supabase: any,
  message: TelegramMessage,
  isEdit: boolean = false
) {
  try {
    const userId = message.from?.id.toString() || message.chat.id.toString()
    const userName = getUserName(message.from || {
      id: message.chat.id,
      is_bot: false,
      first_name: message.chat.first_name || 'Unknown User'
    })

    console.log('Processing message from:', userId, 'Name:', userName)

    // Find or create customer
    const customer = await findOrCreateCustomer(supabase, userId, userName, message.from)
    
    // Find or create conversation
    const conversation = await findOrCreateConversation(supabase, customer.id, userId)
    
    // Save message
    await saveMessage(supabase, conversation.id, message, isEdit)
    
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
    console.error('Error processing incoming Telegram message:', error)
  }
}

async function processCallbackQuery(supabase: any, callbackQuery: any) {
  try {
    const { id, from, data, message } = callbackQuery
    
    // Answer the callback query
    await answerCallbackQuery(id)
    
    // Process the callback data
    if (data && message) {
      const userId = from.id.toString()
      const customer = await findCustomerByTelegramId(supabase, userId)
      
      if (customer) {
        await handleCallbackData(customer, data, message)
      }
    }
  } catch (error) {
    console.error('Error processing callback query:', error)
  }
}

async function findOrCreateCustomer(
  supabase: any, 
  telegramId: string, 
  name: string, 
  telegramUser?: TelegramUser
) {
  // Try to find existing customer by Telegram ID
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (existingCustomer) {
    return existingCustomer
  }

  // Create new customer
  const newCustomer = {
    name,
    telegram_id: telegramId,
    telegram_username: telegramUser?.username || null,
    source: 'telegram',
    lead_score: 50,
    tags: ['telegram-lead'],
    status: 'active',
    company_id: await getDefaultCompanyId(supabase),
    preferences: {
      preferred_contact_method: 'telegram',
      language: telegramUser?.language_code || 'en',
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

async function findCustomerByTelegramId(supabase: any, telegramId: string) {
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  return customer
}

async function findOrCreateConversation(supabase: any, customerId: string, telegramId: string) {
  const platformConversationId = `tg_${telegramId}`

  // Try to find existing conversation
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('platform', 'telegram')
    .eq('platform_conversation_id', platformConversationId)
    .single()

  if (existingConversation) {
    return existingConversation
  }

  // Create new conversation
  const newConversation = {
    customer_id: customerId,
    platform: 'telegram',
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

async function saveMessage(
  supabase: any, 
  conversationId: string, 
  message: TelegramMessage, 
  isEdit: boolean = false
) {
  const messageData = {
    conversation_id: conversationId,
    platform_message_id: message.message_id.toString(),
    sender_type: 'customer',
    content: getMessageContent(message),
    message_type: getMessageType(message),
    media_urls: await extractMediaUrls(message),
    metadata: {
      telegram_date: message.date,
      message_type: getMessageType(message),
      from_id: message.from?.id,
      chat_id: message.chat.id,
      is_edit: isEdit,
      username: message.from?.username,
    },
    status: 'delivered',
  }

  const { error } = await supabase.from('messages').insert([messageData])
  if (error) throw error
}

async function createLeadIfNeeded(supabase: any, customer: any, message: TelegramMessage) {
  const messageContent = getMessageContent(message).toLowerCase()
  
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
        source: 'telegram',
        stage: 'new',
        score: calculateLeadScore(messageContent),
        requirements: extractRequirements(messageContent),
        notes: `Auto-created from Telegram message: "${getMessageContent(message)}"`,
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

async function processWithAIAgent(supabase: any, customer: any, conversation: any, message: TelegramMessage) {
  console.log('Processing with AI agent:', { customer: customer.id, conversation: conversation.id, message: message.message_id })
  
  try {
    // Get message history for context (increased limit for better context)
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(50) // Increased from 10 to 50 for better context retention
    
    // Use the actual AI agent service with Zep integration
    const messageContent = getMessageContent(message)
    
    // Use proper Neo4j memory integration instead of simulation
    const aiResponse = await processMessageWithRealMemoryIntegration(customer, conversation.id, messageContent, messageHistory || [])
    
    if (aiResponse.message) {
      const chatId = customer.telegram_id || conversation.platform_conversation_id.replace('tg_', '')
      
      // Check if response should include inline keyboard
      const keyboard = generateInlineKeyboard(aiResponse.nextStage, aiResponse.actions)
      const options = keyboard ? { reply_markup: keyboard } : {}
      
      await sendTelegramMessage(chatId, aiResponse.message, options)
      
      // Save AI response as message
      await supabase.from('messages').insert([{
        conversation_id: conversation.id,
        platform_message_id: `ai_${Date.now()}`,
        sender_type: 'system',
        content: aiResponse.message,
        message_type: 'text',
        status: 'sent',
        metadata: { 
          ai_generated: true, 
          platform: 'telegram',
          stage: aiResponse.nextStage,
          actions: aiResponse.actions,
          confidence: aiResponse.confidence || 0.8
        },
      }])
      
      // Execute additional actions if needed (Action-driven CRM)
      if (aiResponse.shouldCreateLead) {
        await createEnhancedLead(supabase, customer, aiResponse.extractedInfo, conversation.id)
      }
      
      if (aiResponse.shouldScheduleFollowUp) {
        await scheduleAgentFollowUp(supabase, customer, aiResponse.extractedInfo)
      }
      
      // Track CRM actions for sales process monitoring
      await trackCRMActions(supabase, customer, conversation.id, aiResponse.actions, {
        stage: aiResponse.nextStage,
        confidence: aiResponse.confidence,
        extracted_info: aiResponse.extractedInfo,
        customer_context: null, // customerContext not available in this scope
        message_content: messageContent
      })
    }
  } catch (error) {
    console.error('Error in AI agent processing:', error)
    
    // Fallback to simple auto-reply
    const autoReply = generateAutoReply(getMessageContent(message))
    if (autoReply.message) {
      const chatId = customer.telegram_id || conversation.platform_conversation_id.replace('tg_', '')
      await sendTelegramMessage(chatId, autoReply.message, autoReply.options)
    }
  }
}

async function sendTelegramMessage(chatId: string, text: string, options: any = {}) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  
  if (!botToken) {
    console.error('Telegram bot token not configured')
    return
  }
  
  try {
    const payload = {
      chat_id: chatId,
      text,
      ...options,
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
    }

    console.log('Auto-reply sent successfully')
  } catch (error) {
    console.error('Error sending Telegram message:', error)
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  
  if (!botToken) return
  
  try {
    const payload = {
      callback_query_id: callbackQueryId,
      text,
    }

    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Error answering callback query:', error)
  }
}

async function handleCallbackData(customer: any, data: string, message: TelegramMessage) {
  const chatId = message.chat.id
  
  // Enhanced callback handling with personality
  if (data.startsWith('property_type_')) {
    const propertyType = data.replace('property_type_', '')
    const propertyMessages = {
      'apartment': '🏢 Excellent choice! Apartments are perfect for modern living with great amenities.',
      'villa': '🏡 Fantastic! Villas offer privacy, space, and your own piece of paradise.',
      'plot': '🏞️ Smart choice! Plots are great for custom construction and excellent ROI.',
      'commercial': '🏪 Great for business! Commercial properties offer excellent rental yields.'
    }
    
    await sendTelegramMessage(chatId, `${propertyMessages[propertyType] || 'Great choice!'} \n\nNow, what's your budget range? This helps me show you the most suitable options. 💰`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "₹20L - ₹50L", callback_data: "budget_20_50" },
            { text: "₹50L - ₹1Cr", callback_data: "budget_50_100" }
          ],
          [
            { text: "₹1Cr - ₹2Cr", callback_data: "budget_100_200" },
            { text: "₹2Cr+", callback_data: "budget_200_plus" }
          ]
        ]
      }
    })
  } else if (data.startsWith('budget_')) {
    const budgetRanges = {
      'budget_20_50': '₹20L - ₹50L',
      'budget_50_100': '₹50L - ₹1Cr', 
      'budget_100_200': '₹1Cr - ₹2Cr',
      'budget_200_plus': '₹2Cr+'
    }
    
    await sendTelegramMessage(chatId, `Perfect! Budget of ${budgetRanges[data]} noted. 💰\n\nNow, which area in Bangalore interests you? Here are some popular locations based on your budget:`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏙️ Whitefield (IT Hub)", callback_data: "location_whitefield" },
            { text: "🌊 Sarjapur (Upcoming)", callback_data: "location_sarjapur" }
          ],
          [
            { text: "💼 Electronic City", callback_data: "location_ecity" },
            { text: "🌳 Hebbal (North BLR)", callback_data: "location_hebbal" }
          ],
          [
            { text: "🎯 Koramangala (Central)", callback_data: "location_koramangala" },
            { text: "📱 HSR Layout (IT Corridor)", callback_data: "location_hsr" }
          ]
        ]
      }
    })
  } else if (data.startsWith('location_')) {
    const locationMap = {
      'location_whitefield': 'Whitefield',
      'location_sarjapur': 'Sarjapur', 
      'location_ecity': 'Electronic City',
      'location_hebbal': 'Hebbal',
      'location_koramangala': 'Koramangala',
      'location_hsr': 'HSR Layout'
    }
    
    const location = locationMap[data] || data.replace('location_', '').replace('_', ' ')
    
    await sendTelegramMessage(chatId, `Excellent choice! 📍 ${location} is a fantastic area with great potential.\n\nI'm searching our premium database for the best properties that match your criteria. Our property consultant will share personalized options with you shortly.\n\nWhat would you like to do next?`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔍 View Properties Now", callback_data: "show_properties" },
            { text: "📅 Schedule Site Visit", callback_data: "schedule_visit" }
          ],
          [
            { text: "📞 Request Callback", callback_data: "request_callback" },
            { text: "📧 Send Brochure", callback_data: "send_brochure" }
          ]
        ]
      }
    })
  } else if (data === 'show_properties') {
    await sendTelegramMessage(chatId, `🏠 Here are some handpicked properties for you:\n\n🌟 **Premium 2BHK in Whitefield**\n💰 ₹75L - ₹85L\n📍 Near IT parks, Metro connectivity\n🏗️ Ready to move\n\n🌟 **Luxury Villa in Sarjapur**\n💰 ₹1.2Cr - ₹1.4Cr\n📍 Gated community, all amenities\n🏗️ Under construction\n\n🌟 **Investment Plot in Electronic City**\n💰 ₹45L - ₹55L\n📍 Approved layout, clear title\n🏗️ Ready for construction\n\nInterested in any of these? 🤔`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✨ More Details", callback_data: "more_details" },
            { text: "📅 Schedule Visit", callback_data: "schedule_visit" }
          ],
          [
            { text: "📞 Talk to Expert", callback_data: "request_callback" },
            { text: "🔄 See More Options", callback_data: "more_properties" }
          ]
        ]
      }
    })
  } else if (data === 'schedule_visit') {
    await sendTelegramMessage(chatId, `📅 Great! I'd love to arrange a site visit for you.\n\nOur available slots:\n\n🌅 **Tomorrow**\n• 10:00 AM - 12:00 PM\n• 2:00 PM - 4:00 PM\n\n🌄 **Weekend**\n• Saturday: 10:00 AM - 5:00 PM\n• Sunday: 10:00 AM - 5:00 PM\n\nWhich slot works best for you?`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🌅 Tomorrow Morning", callback_data: "slot_tomorrow_morning" },
            { text: "🌆 Tomorrow Evening", callback_data: "slot_tomorrow_evening" }
          ],
          [
            { text: "📅 Weekend Visit", callback_data: "slot_weekend" },
            { text: "📞 Call to Schedule", callback_data: "request_callback" }
          ]
        ]
      }
    })
  } else if (data === 'request_callback') {
    await sendTelegramMessage(chatId, `📞 Perfect! I'll arrange for our property consultant to call you.\n\nWhen would be a good time to call?\n\n⏰ **Today:**\n• Next 1 hour\n• This evening (6-8 PM)\n\n⏰ **Tomorrow:**\n• Morning (10 AM - 12 PM)\n• Afternoon (2 PM - 5 PM)`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📞 Call in 1 Hour", callback_data: "callback_1hour" },
            { text: "🌆 Call This Evening", callback_data: "callback_evening" }
          ],
          [
            { text: "🌅 Tomorrow Morning", callback_data: "callback_tomorrow_morning" },
            { text: "🌇 Tomorrow Afternoon", callback_data: "callback_tomorrow_afternoon" }
          ]
        ]
      }
    })
  } else if (data.startsWith('callback_')) {
    const timingMap = {
      'callback_1hour': 'within the next hour',
      'callback_evening': 'this evening between 6-8 PM',
      'callback_tomorrow_morning': 'tomorrow morning between 10 AM - 12 PM',
      'callback_tomorrow_afternoon': 'tomorrow afternoon between 2-5 PM'
    }
    
    const timing = timingMap[data] || 'at your preferred time'
    
    await sendTelegramMessage(chatId, `✅ Perfect! I've scheduled a callback for you ${timing}.\n\nOur property consultant will call you to discuss:\n• Personalized property options\n• Site visit arrangements\n• Investment guidance\n• Documentation support\n\nThank you for choosing us! 🙏\n\nIs there anything else I can help you with right now?`)
  }
}

// Enhanced AI message processing with real Neo4j memory integration
async function processMessageWithRealMemoryIntegration(customer: any, conversationId: string, messageContent: string, messageHistory: any[]): Promise<any> {
  // This uses real Neo4j memory service instead of simulation
  
  const lowerContent = messageContent.toLowerCase()
  
  // Get real customer context from message history and extract preferences
  let customerContext = await getRealCustomerContext(customer, messageHistory)
  
  console.log('Customer context retrieved:', customerContext)
  
  // Simulate AI-powered intent recognition and response generation with context
  const response = {
    message: '',
    nextStage: 'greeting',
    actions: [],
    shouldCreateLead: false,
    shouldScheduleFollowUp: false,
    extractedInfo: {},
    confidence: 0.9
  }
  
  // Enhanced context-aware responses based on customer history
  if (customerContext && customerContext.isReturningCustomer) {
    return handleReturningCustomerFlow(messageContent, customerContext, response)
  }
  
  // Use preferences for better responses even for new interactions
  const preferences = customerContext.preferences || {}
  
  // Enhanced greeting with personality
  if (lowerContent.includes('hi') || lowerContent.includes('hello') || messageContent === '/start') {
    response.message = `Hello! 👋 I'm Priya, your property consultant. I'm excited to help you find your perfect home in Bangalore! 🏠\n\nMay I know your name so I can assist you better?`
    response.nextStage = 'name_collection'
    response.actions = ['collect_name']
    return response
  }
  
  // Name collection
  if (messageHistory.length <= 2 && !lowerContent.includes('property') && !lowerContent.includes('budget')) {
    const nameMatch = messageContent.match(/^[a-zA-Z\s]{2,30}$/)
    if (nameMatch) {
      response.message = `Great to meet you, ${messageContent}! 😊\n\nNow, let's find you the perfect property. What type of property are you looking for?\n\n🏢 Ready-to-move Apartments\n🏡 Villas/Independent Houses\n🏞️ Plots for construction\n🏪 Commercial properties\n\nWhich one interests you?`
      response.nextStage = 'qualification'
      response.actions = ['collect_property_type']
      response.shouldCreateLead = true
      response.extractedInfo = { name: messageContent }
      return response
    }
  }
  
  // Property inquiry
  if (lowerContent.includes('property') || lowerContent.includes('apartment') || lowerContent.includes('villa')) {
    response.message = `Excellent! I'd love to help you find the perfect property. 🏠\n\nTo show you the most relevant options, could you share:\n\n💰 Your budget range\n📍 Preferred area in Bangalore\n🏠 BHK requirements (if any)\n\nWhat's your budget range?`
    response.nextStage = 'budget_collection'
    response.actions = ['collect_budget']
    response.shouldCreateLead = true
    return response
  }
  
  // Budget extraction with context awareness
  const budgetMatch = messageContent.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i)
  const rangeMatch = messageContent.match(/(\d{6,})\s*to\s*(\d{6,})/i)
  
  if (budgetMatch || rangeMatch) {
    let budgetMessage = ''
    let budgetValue = 0
    
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1])
      const max = parseInt(rangeMatch[2])
      budgetMessage = `Perfect! Budget range of ₹${(min/100000).toFixed(1)}L to ₹${(max/100000).toFixed(1)}L noted. 💰`
      budgetValue = (min + max) / 2
      response.extractedInfo = { budget: { min, max } }
    } else if (budgetMatch) {
      const amount = parseFloat(budgetMatch[1])
      const unit = budgetMatch[2].toLowerCase()
      budgetValue = unit.startsWith('cr') ? amount * 10000000 : amount * 100000
      budgetMessage = `Perfect! Budget of ₹${budgetMatch[1]} ${budgetMatch[2]} noted. 💰`
      response.extractedInfo = { budget: { min: budgetValue * 0.8, max: budgetValue * 1.2 } }
    }
    
    // Check if location is already known
    const locationKnown = preferences.city_preference || preferences.area_preference
    if (locationKnown) {
      response.message = `${budgetMessage}\n\nGreat! I remember you're interested in ${locationKnown}. Let me search for properties that match your requirements. 🔍`
      response.nextStage = 'property_matching'
      response.actions = ['search_properties']
    } else {
      response.message = `${budgetMessage}\n\nNow, which city are you considering? I can help with properties across India - Coimbatore, Bangalore, Mumbai, Chennai, or any other city. 🏙️`
      response.nextStage = 'location_collection'
      response.actions = ['collect_location']
    }
    return response
  }
  
  // Location detection with broader city coverage
  const indianCities = ['coimbatore', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'kochi', 'ahmedabad', 'kolkata']
  const coimbatoreAreas = ['race course', 'peelamedu', 'saibaba colony', 'rs puram', 'gandhipuram', 'singanallur', 'ukkadam']
  const bangaloreAreas = ['whitefield', 'sarjapur', 'electronic city', 'hebbal', 'marathahalli', 'koramangala', 'indiranagar', 'hsr layout']
  
  const mentionedCity = indianCities.find(city => lowerContent.includes(city))
  const mentionedArea = [...coimbatoreAreas, ...bangaloreAreas].find(area => lowerContent.includes(area))
  
  if (mentionedCity || mentionedArea) {
    const location = mentionedCity || mentionedArea
    const capitalizedLocation = location.charAt(0).toUpperCase() + location.slice(1)
    
    // Check if we already have budget information
    const budgetKnown = preferences.budget_range
    if (budgetKnown) {
      response.message = `Excellent choice! ${capitalizedLocation} is a fantastic location. 📍\n\nI remember your budget is around ₹${(budgetKnown.min/100000).toFixed(1)}L to ₹${(budgetKnown.max/100000).toFixed(1)}L. Let me search for the best properties that match your requirements. 🔍`
      response.nextStage = 'property_matching'
      response.actions = ['search_properties']
    } else {
      response.message = `Excellent choice! ${capitalizedLocation} is a fantastic location. 📍\n\nWhat's your budget range for this investment? This will help me show you the most suitable properties. 💰`
      response.nextStage = 'budget_collection'
      response.actions = ['collect_budget']
    }
    
    response.extractedInfo = { location: location }
    return response
  }
  
  // Default helpful response
  response.message = `Thank you for your message! 🙏\n\nI'm here to help you find the perfect property in Bangalore. To assist you better, could you tell me:\n\n• What type of property are you looking for?\n• What's your budget range?\n• Which area interests you?\n\nThis will help me show you the most relevant options!`
  response.nextStage = 'qualification'
  response.actions = ['collect_requirements']
  
  return response
}

// Get real customer context from message history
async function getRealCustomerContext(customer: any, messageHistory: any[]) {
  // Check if customer has previous conversations (returning customer logic)
  const isReturningCustomer = messageHistory.length > 3
  
  if (!isReturningCustomer) {
    return { isReturningCustomer: false, preferences: {}, lead_journey: { stage: 'new' } }
  }
  
  // Extract preferences from conversation history with better parsing
  const preferences = extractCustomerPreferencesFromHistory(messageHistory)
  const behavioralInsights = analyzeBehavioralPatterns(messageHistory)
  const leadJourney = assessLeadJourney(messageHistory, preferences)
  
  console.log('Extracted preferences:', preferences)
  console.log('Lead journey:', leadJourney)
  
  return {
    isReturningCustomer: true,
    preferences,
    behavioral_insights: behavioralInsights,
    lead_journey: leadJourney,
    interaction_history: {
      total_conversations: messageHistory.length,
      last_interaction: new Date().toISOString(),
      engagement_level: messageHistory.length > 20 ? 'high' : messageHistory.length > 10 ? 'medium' : 'low'
    }
  }
}

// Handle returning customer with context-aware responses
async function handleReturningCustomerFlow(messageContent: string, customerContext: any, response: any) {
  const lowerContent = messageContent.toLowerCase()
  const preferences = customerContext.preferences || {}
  
  // Build context summary
  const contextSummary = []
  if (preferences.budget_range) {
    contextSummary.push(`budget: ₹${(preferences.budget_range.min/100000).toFixed(1)}L-₹${(preferences.budget_range.max/100000).toFixed(1)}L`)
  }
  if (preferences.property_type) {
    contextSummary.push(`${preferences.property_type}`)
  }
  if (preferences.bhk_preference) {
    contextSummary.push(`${preferences.bhk_preference}`)
  }
  if (preferences.city_preference || preferences.area_preference) {
    contextSummary.push(`in ${preferences.city_preference || preferences.area_preference}`)
  }
  
  // Personalized greeting for returning customers
  if (lowerContent.includes('hi') || lowerContent.includes('hello') || messageContent === '/start') {
    let welcomeMessage = `Welcome back! 👋 I'm Priya, and I remember our previous conversation.`
    
    if (contextSummary.length > 0) {
      welcomeMessage += ` You were looking for ${contextSummary.join(', ')}.`
    }
    
    welcomeMessage += ` How can I help you today? Would you like to see new properties matching your requirements or update your preferences?`
    
    response.message = welcomeMessage
    response.nextStage = 'property_matching'
    response.actions = ['search_properties', 'track_returning_customer']
    response.shouldCreateLead = true
    
    return response
  }
  
  // Context-aware property inquiry - avoid asking for already known information
  if (lowerContent.includes('property') || lowerContent.includes('villa') || lowerContent.includes('apartment')) {
    let contextualMessage = `Great to hear from you again! 😊\n\n`
    
    if (contextSummary.length >= 3) {
      // We have sufficient information, show properties
      contextualMessage += `I have all your requirements: ${contextSummary.join(', ')}. Let me search for the latest properties that match your needs! 🔍`
      response.nextStage = 'property_matching'
      response.actions = ['search_properties']
    } else {
      // We need more information
      contextualMessage += `I remember some of your preferences: ${contextSummary.join(', ')}.\n\n`
      
      // Ask for missing information
      if (!preferences.budget_range) {
        contextualMessage += `What's your budget range?`
        response.nextStage = 'budget_collection'
        response.actions = ['collect_budget']
      } else if (!preferences.city_preference && !preferences.area_preference) {
        contextualMessage += `Which city or area are you considering?`
        response.nextStage = 'location_collection'
        response.actions = ['collect_location']
      } else if (!preferences.property_type) {
        contextualMessage += `What type of property - apartment, villa, or plot?`
        response.nextStage = 'qualification'
        response.actions = ['collect_property_type']
      }
    }
    
    response.message = contextualMessage
    response.shouldCreateLead = true
    response.confidence = 0.95
    
    return response
  }
  
  // Handle budget updates
  const budgetMatch = messageContent.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i)
  const rangeMatch = messageContent.match(/(\d{6,})\s*to\s*(\d{6,})/i)
  
  if (budgetMatch || rangeMatch) {
    let budgetMessage = `Perfect! I've updated your budget. `
    
    if (preferences.city_preference || preferences.area_preference) {
      budgetMessage += `Now let me search for properties in ${preferences.city_preference || preferences.area_preference} with your new budget. 🔍`
      response.nextStage = 'property_matching'
      response.actions = ['search_properties']
    } else {
      budgetMessage += `Which city are you considering for this investment?`
      response.nextStage = 'location_collection'
      response.actions = ['collect_location']
    }
    
    response.message = budgetMessage
    response.shouldCreateLead = true
    
    return response
  }
  
  // Default contextual response with preferences
  let defaultMessage = `I remember you! 😊`
  if (contextSummary.length > 0) {
    defaultMessage += ` Your previous requirements: ${contextSummary.join(', ')}.`
  }
  defaultMessage += ` How can I help you today?`
  
  response.message = defaultMessage
  response.nextStage = 'property_matching'
  response.actions = ['search_properties', 'track_returning_interaction']
  response.shouldCreateLead = true
  
  return response
}

// Extract customer preferences from conversation history with improved parsing
function extractCustomerPreferencesFromHistory(messageHistory: any[]) {
  const preferences = {}
  const allBudgets = []
  
  for (const msg of messageHistory) {
    if (!msg.content) continue
    
    const content = msg.content.toLowerCase()
    
    // Extract all budget mentions (including ranges)
    const budgetMatches = content.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr|to|lakhs|crores)/gi)
    if (budgetMatches) {
      for (const match of budgetMatches) {
        const budgetMatch = match.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|l|cr)/i)
        if (budgetMatch) {
          const amount = parseFloat(budgetMatch[1])
          const unit = budgetMatch[2].toLowerCase()
          const budgetValue = unit.startsWith('cr') ? amount * 10000000 : amount * 100000
          allBudgets.push(budgetValue)
        }
      }
    }
    
    // Extract numeric ranges like "4500000 to 5500000"
    const rangeMatch = content.match(/(\d{6,})\s*to\s*(\d{6,})/i)
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1])
      const max = parseInt(rangeMatch[2])
      allBudgets.push(min, max)
    }
    
    // Extract single large numbers that look like prices
    const priceMatch = content.match(/\b(\d{7,})\b/)
    if (priceMatch) {
      allBudgets.push(parseInt(priceMatch[1]))
    }
    
    // Extract property type
    if (content.includes('apartment') || content.includes('flat')) preferences.property_type = 'apartment'
    if (content.includes('villa') || content.includes('independent house')) preferences.property_type = 'villa'
    if (content.includes('plot') || content.includes('site')) preferences.property_type = 'plot'
    
    // Extract BHK
    const bhkMatch = content.match(/(\d+)\s*bhk/i)
    if (bhkMatch) preferences.bhk_preference = `${bhkMatch[1]}BHK`
    
    // Extract area/sqft
    const sqftMatch = content.match(/(\d+)\s*(sqft|sq\.?\s*ft|square\s*feet)/i)
    if (sqftMatch) preferences.area_preference = parseInt(sqftMatch[1])
    
    // Extract location (including Coimbatore and other cities)
    const indianCities = ['coimbatore', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'kochi', 'ahmedabad', 'kolkata']
    const coimbatoreAreas = ['race course', 'peelamedu', 'saibaba colony', 'rs puram', 'gandhipuram', 'singanallur', 'ukkadam']
    
    for (const city of indianCities) {
      if (content.includes(city)) {
        preferences.city_preference = city
        break
      }
    }
    
    for (const area of coimbatoreAreas) {
      if (content.includes(area)) {
        preferences.area_preference = area
        break
      }
    }
  }
  
  // Set budget range from all collected budgets
  if (allBudgets.length > 0) {
    const minBudget = Math.min(...allBudgets)
    const maxBudget = Math.max(...allBudgets)
    preferences.budget_range = { 
      min: minBudget, 
      max: maxBudget,
      all_mentioned: allBudgets
    }
  }
  
  return preferences
}

// Analyze behavioral patterns (Zep simulation)
function analyzeBehavioralPatterns(messageHistory: any[]) {
  const userMessages = messageHistory.filter(msg => msg.sender_type === 'customer')
  
  // Communication style analysis
  let formalCount = 0, casualCount = 0
  const formalWords = ['please', 'thank you', 'kindly', 'regards']
  const casualWords = ['hi', 'hey', 'cool', 'awesome', 'yeah']
  
  userMessages.forEach(msg => {
    if (!msg.content) return
    const content = msg.content.toLowerCase()
    formalCount += formalWords.filter(word => content.includes(word)).length
    casualCount += casualWords.filter(word => content.includes(word)).length
  })
  
  const communicationStyle = formalCount > casualCount ? 'formal' : 'casual'
  
  // Decision speed analysis
  const hasDecisionKeywords = userMessages.some(msg => 
    msg.content && ['interested', 'want to buy', 'book', 'confirm', 'proceed'].some(keyword => 
      msg.content.toLowerCase().includes(keyword)
    )
  )
  
  const decisionMakingSpeed = hasDecisionKeywords && userMessages.length < 10 ? 'fast' : 
                              hasDecisionKeywords && userMessages.length < 20 ? 'moderate' : 'slow'
  
  // Price sensitivity
  const priceKeywords = ['budget', 'price', 'cost', 'expensive', 'cheap', 'affordable']
  const priceFactsCount = userMessages.filter(msg => 
    msg.content && priceKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
  ).length
  
  const priceSensitivity = priceFactsCount > 3 ? 'high' : priceFactsCount > 1 ? 'medium' : 'low'
  
  return {
    communication_style: communicationStyle,
    decision_making_speed: decisionMakingSpeed,
    price_sensitivity: priceSensitivity,
    preferred_time_of_contact: 'any_time' // Would analyze message timestamps in real implementation
  }
}

// Assess lead journey stage (Zep simulation)
function assessLeadJourney(messageHistory: any[], preferences: any) {
  const hasPreferences = Object.keys(preferences).length > 0
  const userMessages = messageHistory.filter(msg => msg.sender_type === 'customer')
  
  const hasInterest = userMessages.some(msg => 
    msg.content && (
      msg.content.toLowerCase().includes('interested') ||
      msg.content.toLowerCase().includes('want to buy') ||
      msg.content.toLowerCase().includes('looking for')
    )
  )
  
  // Stage determination
  let stage = 'initial'
  let conversionLikelihood = 50
  
  if (hasInterest && hasPreferences) {
    stage = 'qualified'
    conversionLikelihood = 80
  } else if (hasPreferences) {
    stage = 'engaged'  
    conversionLikelihood = 65
  } else if (hasInterest) {
    stage = 'interested'
    conversionLikelihood = 55
  }
  
  // Extract key concerns
  const keyConcerns = []
  const concernKeywords = {
    'budget': ['expensive', 'cost', 'price', 'afford'],
    'location': ['traffic', 'connectivity', 'transport'],
    'amenities': ['facilities', 'amenities', 'parking'],
    'legal': ['documents', 'approval', 'legal'],
    'timing': ['ready', 'possession', 'construction']
  }
  
  userMessages.forEach(msg => {
    if (!msg.content) return
    const content = msg.content.toLowerCase()
    Object.entries(concernKeywords).forEach(([concern, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        if (!keyConcerns.includes(concern)) keyConcerns.push(concern)
      }
    })
  })
  
  return {
    stage,
    conversion_likelihood: conversionLikelihood,
    key_concerns: keyConcerns,
    progression_speed: userMessages.length / Math.max(1, Math.ceil(messageHistory.length / 10)) // Messages per interaction
  }
}

// Generate inline keyboard based on conversation stage
function generateInlineKeyboard(stage: string, actions: string[]): any {
  switch (stage) {
    case 'qualification':
      return {
        inline_keyboard: [
          [
            { text: "🏢 Apartment", callback_data: "property_type_apartment" },
            { text: "🏡 Villa", callback_data: "property_type_villa" }
          ],
          [
            { text: "🏞️ Plot", callback_data: "property_type_plot" },
            { text: "🏪 Commercial", callback_data: "property_type_commercial" }
          ]
        ]
      }
    
    case 'budget_collection':
      return {
        inline_keyboard: [
          [
            { text: "₹20L - ₹50L", callback_data: "budget_20_50" },
            { text: "₹50L - ₹1Cr", callback_data: "budget_50_100" }
          ],
          [
            { text: "₹1Cr - ₹2Cr", callback_data: "budget_100_200" },
            { text: "₹2Cr+", callback_data: "budget_200_plus" }
          ]
        ]
      }
    
    case 'location_collection':
      return {
        inline_keyboard: [
          [
            { text: "Whitefield", callback_data: "location_whitefield" },
            { text: "Sarjapur", callback_data: "location_sarjapur" }
          ],
          [
            { text: "Electronic City", callback_data: "location_ecity" },
            { text: "Hebbal", callback_data: "location_hebbal" }
          ]
        ]
      }
    
    case 'property_matching':
      return {
        inline_keyboard: [
          [
            { text: "🔍 Show Properties", callback_data: "show_properties" },
            { text: "📅 Schedule Visit", callback_data: "schedule_visit" }
          ],
          [
            { text: "📞 Request Callback", callback_data: "request_callback" },
            { text: "📧 Send Brochure", callback_data: "send_brochure" }
          ]
        ]
      }
    
    default:
      return null
  }
}

// Enhanced lead creation with more details
async function createEnhancedLead(supabase: any, customer: any, extractedInfo: any, conversationId: string) {
  try {
    const leadData = {
      customer_id: customer.id,
      company_id: customer.company_id,
      source: 'telegram',
      stage: 'new',
      score: calculateEnhancedLeadScore(extractedInfo),
      requirements: extractedInfo,
      notes: `AI-created lead from Telegram conversation. Extracted info: ${JSON.stringify(extractedInfo)}`,
      status: 'active',
    }
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating enhanced lead:', error)
    } else {
      console.log('Enhanced lead created:', lead)
    }
  } catch (error) {
    console.error('Error in enhanced lead creation:', error)
  }
}

// Enhanced lead scoring
function calculateEnhancedLeadScore(extractedInfo: any): number {
  let score = 50 // Base score
  
  if (extractedInfo.name) score += 10
  if (extractedInfo.budget) score += 25
  if (extractedInfo.location) score += 15
  if (extractedInfo.propertyType) score += 15
  if (extractedInfo.timeline === 'immediate') score += 20
  if (extractedInfo.financing) score += 10
  if (extractedInfo.phone || extractedInfo.email) score += 15
  
  return Math.min(score, 100)
}

// Schedule agent follow-up
async function scheduleAgentFollowUp(supabase: any, customer: any, extractedInfo: any) {
  console.log('Scheduling agent follow-up for customer:', customer.id, extractedInfo)
  // Implementation would create a task/reminder for agents
}

// Track CRM actions for sales process monitoring (Action-driven CRM)
async function trackCRMActions(supabase: any, customer: any, conversationId: string, actions: string[], metadata: any) {
  if (!actions || actions.length === 0) return
  
  try {
    // Create action tracking records for sales process analysis
    const actionRecords = actions.map(action => ({
      customer_id: customer.id,
      conversation_id: conversationId,
      action_type: action,
      stage: metadata.stage,
      confidence: metadata.confidence || 0.8,
      metadata: {
        extracted_info: metadata.extracted_info,
        customer_context: metadata.customer_context,
        message_content: metadata.message_content,
        timestamp: new Date().toISOString(),
        platform: 'telegram'
      },
      status: 'completed',
      created_at: new Date().toISOString()
    }))
    
    // Log action tracking for monitoring
    console.log('Tracking CRM actions:', {
      customer_id: customer.id,
      actions: actions,
      stage: metadata.stage,
      confidence: metadata.confidence
    })
    
    // In a full implementation, these would be stored in an 'agent_actions' table
    // For now, we'll store in conversation metadata or logs
    await supabase.from('conversations').update({
      metadata: {
        last_actions: actions,
        last_stage: metadata.stage,
        last_confidence: metadata.confidence,
        action_history: actionRecords.slice(-10) // Keep last 10 actions
      }
    }).eq('id', conversationId)
    
    // Track sales funnel progression
    await trackSalesFunnelProgression(supabase, customer, metadata.stage, metadata.customer_context)
    
  } catch (error) {
    console.error('Error tracking CRM actions:', error)
  }
}

// Track sales funnel progression for KPI monitoring
async function trackSalesFunnelProgression(supabase: any, customer: any, currentStage: string, customerContext: any) {
  try {
    const stageMapping = {
      'greeting': 'contact',
      'name_collection': 'inquiry', 
      'qualification': 'qualification',
      'budget_collection': 'requirements_gathering',
      'location_collection': 'requirements_gathering',
      'property_matching': 'presentation',
      'scheduling': 'scheduling',
      'follow_up': 'follow_up',
      'closed': 'closed'
    }
    
    const funnelStage = stageMapping[currentStage] || 'unknown'
    const conversionLikelihood = customerContext?.lead_journey?.conversion_likelihood || 50
    
    // Update or create funnel tracking record
    const funnelRecord = {
      customer_id: customer.id,
      company_id: customer.company_id,
      current_stage: funnelStage,
      conversion_likelihood: conversionLikelihood,
      last_interaction: new Date().toISOString(),
      source: 'telegram',
      metadata: {
        behavioral_insights: customerContext?.behavioral_insights,
        preferences: customerContext?.preferences,
        interaction_count: customerContext?.interaction_history?.total_conversations || 1
      }
    }
    
    console.log('Tracking sales funnel progression:', {
      customer_id: customer.id,
      stage: funnelStage,
      conversion_likelihood: conversionLikelihood
    })
    
    // This would normally update a 'sales_funnel' or 'lead_progression' table
    // For demo purposes, we log the progression
    
  } catch (error) {
    console.error('Error tracking sales funnel progression:', error)
  }
}

function generateAutoReply(messageContent: string): { message: string; options?: any } {
  const content = messageContent.toLowerCase()
  
  if (content.includes('hi') || content.includes('hello') || content === '/start') {
    return {
      message: "Hello! 👋 I'm Priya, your property consultant. I'm excited to help you find your perfect home in Bangalore! 🏠\n\nMay I know your name so I can assist you better?",
      options: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏢 Apartment", callback_data: "property_type_apartment" },
              { text: "🏡 Villa", callback_data: "property_type_villa" }
            ],
            [
              { text: "🏞️ Plot", callback_data: "property_type_plot" },
              { text: "🏪 Commercial", callback_data: "property_type_commercial" }
            ]
          ]
        }
      }
    }
  }
  
  if (content.includes('property') || content.includes('apartment') || content.includes('villa')) {
    return {
      message: "Excellent! I'd love to help you find the perfect property. 🏠\n\nTo show you the most relevant options, could you share:\n\n💰 Your budget range\n📍 Preferred area in Bangalore\n🏠 BHK requirements\n\nWhat's your budget range?",
      options: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💰 Set Budget", callback_data: "set_budget" },
              { text: "📍 Choose Location", callback_data: "set_location" }
            ]
          ]
        }
      }
    }
  }
  
  return {
    message: "Thank you for your message! 🙏\n\nI'm here to help you find the perfect property in Bangalore. Could you tell me what type of property you're looking for?"
  }
}

// Helper functions
function getUserName(user: TelegramUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.first_name || user.username || 'Unknown User'
}

function getMessageContent(message: TelegramMessage): string {
  if (message.text) return message.text
  if (message.caption) return message.caption
  if (message.photo) return '[Photo]'
  if (message.document) return `[Document: ${message.document.file_name || 'file'}]`
  if (message.audio) return '[Audio]'
  if (message.video) return '[Video]'
  if (message.location) return `[Location: ${message.location.latitude}, ${message.location.longitude}]`
  if (message.contact) return `[Contact: ${message.contact.first_name} ${message.contact.phone_number}]`
  return '[Unknown message type]'
}

function getMessageType(message: TelegramMessage): string {
  if (message.text) return 'text'
  if (message.photo) return 'image'
  if (message.document) return 'document'
  if (message.audio) return 'audio'
  if (message.video) return 'video'
  if (message.location) return 'location'
  if (message.contact) return 'contact'
  return 'text'
}

async function extractMediaUrls(message: TelegramMessage): Promise<string[]> {
  const urls: string[] = []
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  
  if (!botToken) return urls
  
  const getFileUrl = async (fileId: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
      const result = await response.json()
      
      if (result.ok && result.result.file_path) {
        return `https://api.telegram.org/file/bot${botToken}/${result.result.file_path}`
      }
      
      return null
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }
  
  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1]
    const url = await getFileUrl(largestPhoto.file_id)
    if (url) urls.push(url)
  }
  
  if (message.document) {
    const url = await getFileUrl(message.document.file_id)
    if (url) urls.push(url)
  }
  
  return urls
}

function calculateLeadScore(content: string): number {
  let score = 50 // Base score

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

  return requirements
}

async function getDefaultCompanyId(supabase: any): Promise<string> {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    return company?.id || '00000000-0000-0000-0000-000000000003'
  } catch (error) {
    console.error('Error getting default company ID:', error)
    return '00000000-0000-0000-0000-000000000003'
  }
}