# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

### Supabase Functions
- `supabase functions deploy telegram-webhook` - Deploy Telegram webhook function
- `supabase functions deploy whatsapp-webhook` - Deploy WhatsApp webhook function

## Architecture Overview

### Frontend Structure
This is a **multi-tenant real estate CRM** built with React 18 + TypeScript, using:
- **Vite** as build tool
- **Tailwind CSS** for styling
- **Zustand** for state management with persistence
- **React Query** for data fetching and caching
- **React Router** for navigation
- **React Hook Form + Zod** for form handling and validation

### Backend & Database
- **Supabase** as backend-as-a-service providing PostgreSQL database, authentication, and Edge Functions
- **Row Level Security (RLS)** for multi-tenant data isolation
- **Supabase Edge Functions** for serverless webhooks (Telegram/WhatsApp integration)

### Key Architectural Patterns

1. **Multi-Tenant Architecture**: Data is isolated by `company_id` across all tables with RLS policies
2. **Role-Based Access Control**: Users have roles (admin, manager, agent, viewer) with different permissions
3. **Dual Authentication**: System admins and company users have separate auth flows
4. **AI-Powered Lead Processing**: Automatic lead creation and qualification from messaging platforms

### Core Domain Models

The application manages these primary entities:
- **Companies**: Tenant organizations with their own data isolation
- **Users**: Company team members with role-based permissions  
- **Customers**: Contact database with multi-platform integration (Telegram, WhatsApp)
- **Properties**: Real estate inventory with detailed specifications
- **Leads**: Sales pipeline with AI-powered scoring and qualification
- **Conversations/Messages**: Multi-platform messaging (Telegram, WhatsApp) with AI responses

### State Management
- **Authentication**: Persisted in `src/store/authStore.ts` using Zustand with localStorage persistence
- **Data Fetching**: React Query hooks in `src/hooks/` for server state management
- **Form State**: React Hook Form with Zod validation schemas

### Messaging Integration
- **Telegram Bot**: Complete webhook handler in `supabase/functions/telegram-webhook/`
- **AI Agent**: Intelligent conversation flows with automatic lead creation
- **Multi-Platform**: Unified messaging system supporting Telegram and WhatsApp

### Type Safety
- Comprehensive TypeScript types in `src/types/index.ts`
- Database types defined in `src/lib/supabase.ts`
- Form validation schemas using Zod

### Key Configuration Files
- `vite.config.ts`: Vite configuration with React plugin
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `eslint.config.js`: ESLint configuration
- `supabase/migrations/`: Database schema migrations

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Database Schema Notes
- All tables use UUID as primary keys
- Timestamps (`created_at`, `updated_at`) on all entities
- JSONB fields for flexible data (`settings`, `preferences`, `metadata`)
- Multi-tenant isolation via RLS policies based on `company_id`