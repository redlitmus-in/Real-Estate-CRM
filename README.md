# Real Estate CRM with AI Agent

A comprehensive real estate CRM system with AI-powered customer interactions, property management, and lead automation.

## 🚀 Features

- **AI-Powered Conversations**: Real-time AI agent for customer interactions
- **Property Management**: Complete property listing and search system
- **Lead Management**: Automated lead scoring and qualification
- **Multi-Platform Messaging**: Telegram and WhatsApp integration
- **Neo4j Graph Database**: Advanced customer relationship and property matching
- **Real-time Analytics**: Dashboard with conversation insights

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT-4 Integration
- **Memory**: Neo4j Graph Database
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query

## 📋 Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Neo4j database (optional)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Neo4j Configuration (Optional)
VITE_NEO4J_URL=bolt://localhost:7687
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=your_neo4j_password

# Telegram Configuration (Optional)
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_WEBHOOK_URL=your_webhook_url

# WhatsApp Configuration (Optional)
VITE_WHATSAPP_API_KEY=your_whatsapp_api_key
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Feature Flags
VITE_AI_AGENT_ENABLED=true
VITE_AUTO_LEAD_CREATION=true
```

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realestate-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Supabase Setup

1. Create a new Supabase project
2. Run the migration files in `supabase/migrations/`
3. Set up Row Level Security (RLS) policies
4. Configure Edge Functions for webhooks

### Neo4j Setup (Optional)

1. Install Neo4j Desktop or use Neo4j AuraDB
2. Create a new database
3. Run the schema setup:

```cypher
// Create indexes for performance
CREATE INDEX customer_id FOR (c:Customer) ON (c.id);
CREATE INDEX property_type FOR (p:Property) ON (p.type);
CREATE INDEX session_id FOR (s:Session) ON (s.id);
```

## 🤖 AI Agent Features

### Conversation Flow
- **Greeting Stage**: Welcome and initial engagement
- **Qualification Stage**: Property type and requirements collection
- **Budget Collection**: Financial requirements gathering
- **Location Collection**: Area preferences
- **Property Matching**: AI-powered property recommendations
- **Scheduling**: Site visit coordination

### Memory Integration
- **Neo4j Graph Database**: Customer relationship tracking
- **Session Management**: Conversation history persistence
- **Preference Learning**: Customer preference evolution
- **Lead Scoring**: Graph-based qualification algorithms

## 📱 Platform Integrations

### Telegram Bot
- Webhook-based message processing
- AI-powered responses
- Rich media support
- Inline keyboard interactions

### WhatsApp Business API
- Template message support
- Media message handling
- Status tracking
- Automated responses

## 🏠 Property Management

### Features
- **Property Search**: AI-powered property matching
- **Filtering**: Location, budget, BHK, amenities
- **Recommendations**: Similar property suggestions
- **Lead Tracking**: Property interest tracking

### Property Types
- Apartments (1BHK, 2BHK, 3BHK+)
- Villas and Independent Houses
- Plots and Land
- Commercial Properties

## 📊 Analytics Dashboard

### Metrics
- **Conversation Statistics**: Total conversations, active chats
- **Response Times**: Average response time tracking
- **Platform Distribution**: Telegram vs WhatsApp usage
- **Lead Conversion**: Lead qualification rates

### Real-time Updates
- Live conversation monitoring
- Message status tracking
- Lead score updates
- Property view analytics

## 🔒 Security

- **Row Level Security**: Database-level access control
- **Environment Variables**: Secure configuration management
- **API Key Protection**: Secure API key handling
- **Webhook Verification**: Platform webhook security

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Supabase Edge Functions
1. Deploy webhook functions
2. Configure platform webhooks
3. Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Updates

### Recent Changes
- ✅ Removed Zep integration
- ✅ Added Neo4j graph database support
- ✅ Enhanced AI agent with property search
- ✅ Improved conversation flow
- ✅ Added multi-city property support

### Roadmap
- [ ] Advanced property recommendations
- [ ] Customer journey analytics
- [ ] Automated follow-up scheduling
- [ ] Integration with property listing sites
- [ ] Mobile app development