import { supabase } from '../lib/supabase';
import { User, Admin, Company } from '../types';

export interface AuthResponse {
  user?: User;
  admin?: Admin;
  company?: Company;
  token: string;
  refreshToken: string;
}

export class AuthService {
  static async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // First, check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!adminError && adminData) {
      // User is an admin, return admin data without company
      return {
        admin: adminData,
        token: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
      };
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      throw new Error('User not found in system');
    }

    // Get company details
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userData.company_id)
      .single();

    if (companyError) {
      throw new Error('Company not found');
    }

    return {
      user: userData,
      company: companyData,
      token: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token || '',
    };
  }

  static async signUp(email: string, password: string, name: string, companyId?: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // Create user record in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        name,
        company_id: companyId,
        role: 'agent',
        status: 'active',
      })
      .select()
      .single();

    if (userError) {
      throw new Error('Failed to create user record');
    }

    return {
      user: userData,
      token: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token || '',
    };
  }

  static async signOut(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  static async getCurrentUser(): Promise<AuthResponse | null> {
    if (!supabase) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    // First, check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!adminError && adminData) {
      // User is an admin, return admin data without company
      return {
        admin: adminData,
        token: session.access_token,
        refreshToken: session.refresh_token,
      };
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return null;
    }

    // Get company details
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userData.company_id)
      .single();

    if (companyError) {
      return null;
    }

    return {
      user: userData,
      company: companyData,
      token: session.access_token,
      refreshToken: session.refresh_token,
    };
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // First, check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!adminError && adminData) {
      // User is an admin, return admin data without company
      return {
        admin: adminData,
        token: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
      };
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      throw new Error('User not found');
    }

    // Get company details
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userData.company_id)
      .single();

    if (companyError) {
      throw new Error('Company not found');
    }

    return {
      user: userData,
      company: companyData,
      token: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token || '',
    };
  }
} 