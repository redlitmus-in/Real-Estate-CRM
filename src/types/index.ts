// Core Types for PropConnect CRM

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  status: UserStatus;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: AdminStatus;
}

export interface Company {
  id: string;
  admin_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: Address;
  settings: CompanySettings;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
  status: CompanyStatus;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
  telegram_id?: string;
  telegram_username?: string;
  alternate_phone?: string;
  source: CustomerSource;
  lead_score: number;
  tags: string[];
  notes?: string;
  address?: Address;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  status: CustomerStatus;
}

export interface Property {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  type: PropertyType;
  sub_type?: string;
  bhk_type?: BHKType;
  area_sqft?: number;
  area_sqmt?: number;
  price_min?: number;
  price_max?: number;
  price_per_sqft?: number;
  location: PropertyLocation;
  amenities: string[];
  images: string[];
  documents: string[];
  rera_number?: string;
  possession_date?: string;
  floor_details?: Record<string, any>;
  parking_details?: Record<string, any>;
  specifications: Record<string, any>;
  created_at: string;
  updated_at: string;
  status: PropertyStatus;
}

export interface Lead {
  id: string;
  company_id: string;
  customer_id: string;
  property_id?: string;
  assigned_to?: string;
  source: LeadSource;
  stage: LeadStage;
  score: number;
  budget_min?: number;
  budget_max?: number;
  requirements: Record<string, any>;
  notes?: string;
  next_follow_up?: string;
  created_at: string;
  updated_at: string;
  status: LeadStatus;
}

export interface Conversation {
  id: string;
  company_id: string;
  customer_id: string;
  platform: MessagingPlatform;
  platform_conversation_id: string;
  last_message_at: string;
  created_at: string;
  status: ConversationStatus;
}

export interface Message {
  id: string;
  conversation_id: string;
  platform_message_id: string;
  sender_type: MessageSender;
  sender_id?: string;
  content?: string;
  message_type: MessageType;
  media_urls: string[];
  metadata: Record<string, any>;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  status: MessageStatus;
}

// Enums
export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AdminStatus = 'active' | 'inactive' | 'suspended';
export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'trial';
export type SubscriptionPlan = 'trial' | 'basic' | 'professional' | 'enterprise';

export type CustomerSource = 'manual' | 'whatsapp' | 'facebook' | 'viber' | 'website' | 'referral' | 'advertisement';
export type CustomerSource = 'manual' | 'whatsapp' | 'facebook' | 'viber' | 'telegram' | 'website' | 'referral' | 'advertisement';
export type CustomerStatus = 'active' | 'inactive' | 'blacklisted';

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'warehouse' | 'office';
export type BHKType = '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK+';
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'under_construction' | 'inactive';

export type LeadSource = 'whatsapp' | 'facebook' | 'viber' | 'manual' | 'website' | 'referral';
export type LeadSource = 'whatsapp' | 'facebook' | 'viber' | 'telegram' | 'manual' | 'website' | 'referral';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type LeadStatus = 'active' | 'inactive' | 'archived';

export type MessagingPlatform = 'whatsapp' | 'facebook' | 'viber' | 'telegram';
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type MessageSender = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

// Supporting Interfaces
export interface Address {
  street?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyLocation {
  address: Address;
  locality?: string;
  landmark?: string;
  distance_from_metro?: number;
  nearby_facilities: string[];
}

export interface CompanySettings {
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
  };
  messaging?: {
    whatsapp_enabled: boolean;
    facebook_enabled: boolean;
    viber_enabled: boolean;
    auto_reply_enabled: boolean;
  };
  lead_scoring?: {
    source_weights: Record<string, number>;
    activity_weights: Record<string, number>;
  };
  notifications?: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  company_slug?: string;
}

export interface CompanyForm {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Partial<Address>;
}

export interface CustomerForm {
  name: string;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
  source: CustomerSource;
  tags?: string[];
  notes?: string;
  address?: Partial<Address>;
}

export interface PropertyForm {
  title: string;
  description?: string;
  type: PropertyType;
  sub_type?: string;
  bhk_type?: BHKType;
  area_sqft?: number;
  price_min?: number;
  price_max?: number;
  location: Partial<PropertyLocation>;
  amenities?: string[];
  rera_number?: string;
  possession_date?: string;
}

export interface LeadForm {
  customer_id: string;
  property_id?: string;
  source: LeadSource;
  budget_min?: number;
  budget_max?: number;
  requirements?: Record<string, any>;
  notes?: string;
}