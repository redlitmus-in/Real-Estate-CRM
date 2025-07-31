/*
  # Create Messaging Tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `customer_id` (uuid, foreign key to customers)
      - `platform` (enum: whatsapp, facebook, viber, telegram)
      - `platform_conversation_id` (text)
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)
      - `status` (enum: active, closed, archived)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `platform_message_id` (text)
      - `sender_type` (enum: customer, agent, system)
      - `sender_id` (uuid, optional)
      - `content` (text, optional)
      - `message_type` (enum: text, image, document, audio, video, location)
      - `media_urls` (text array)
      - `metadata` (jsonb)
      - `delivered_at` (timestamp, optional)
      - `read_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `status` (enum: sent, delivered, read, failed)

  2. Security
    - Enable RLS on both tables
    - Add policies for company-based access
*/

-- Create enums
CREATE TYPE messaging_platform AS ENUM ('whatsapp', 'facebook', 'viber', 'telegram');
CREATE TYPE conversation_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE message_sender AS ENUM ('customer', 'agent', 'system');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'audio', 'video', 'location');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  platform messaging_platform NOT NULL,
  platform_conversation_id text NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  status conversation_status DEFAULT 'active',
  UNIQUE(company_id, platform, platform_conversation_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  platform_message_id text NOT NULL,
  sender_type message_sender NOT NULL,
  sender_id uuid,
  content text,
  message_type message_type DEFAULT 'text',
  media_urls text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  status message_status DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can manage conversations in their company"
  ON conversations
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE admin_id = auth.uid()
    )
  );

-- Create policies for messages
CREATE POLICY "Users can manage messages in their company"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE company_id IN (
        SELECT id FROM companies WHERE admin_id = auth.uid()
      )
    )
  );

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_platform_message_id ON messages(platform_message_id);