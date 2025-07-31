import { createClient } from '@supabase/supabase-js';

// Use the RealEstate project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://damwziikipgvuxdqakos.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbXd6aWlraXBndnV4ZHFha29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDMwNzQsImV4cCI6MjA2OTQxOTA3NH0.oOF9jQOR0yitrx_1OEbEcQwmYx7DLSp6ZQ6jyPfJ7_g';

console.log('Supabase config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  envUrl: import.meta.env.VITE_SUPABASE_URL,
  envKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log('Supabase client created:', !!supabase);

// Database Types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
          status: 'active' | 'inactive' | 'suspended';
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended';
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended';
        };
      };
      companies: {
        Row: {
          id: string;
          admin_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website: string | null;
          phone: string | null;
          email: string | null;
          address: any | null;
          settings: any;
          subscription_plan: 'trial' | 'basic' | 'professional' | 'enterprise';
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
          status: 'active' | 'inactive' | 'suspended' | 'trial';
        };
        Insert: {
          id?: string;
          admin_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          website?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: any | null;
          settings?: any;
          subscription_plan?: 'trial' | 'basic' | 'professional' | 'enterprise';
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended' | 'trial';
        };
        Update: {
          id?: string;
          admin_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          website?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: any | null;
          settings?: any;
          subscription_plan?: 'trial' | 'basic' | 'professional' | 'enterprise';
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended' | 'trial';
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          name: string;
          phone: string | null;
          role: 'admin' | 'manager' | 'agent' | 'viewer';
          permissions: string[];
          profile: any;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
          status: 'active' | 'inactive' | 'suspended';
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: 'admin' | 'manager' | 'agent' | 'viewer';
          permissions?: string[];
          profile?: any;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended';
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: 'admin' | 'manager' | 'agent' | 'viewer';
          permissions?: string[];
          profile?: any;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'suspended';
        };
      };
    };
  };
};