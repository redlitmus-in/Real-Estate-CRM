import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Company, CompanyForm } from '../types';
import toast from 'react-hot-toast';

// Check if Supabase is available
const isSupabaseAvailable = () => !!supabase;

// Utility function to validate UUID format
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Companies
export const useCompanies = (adminId?: string) => {
  return useQuery({
    queryKey: ['companies', adminId],
    queryFn: async () => {
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase client not initialized');
      }
      
      let query = supabase.from('companies').select('*');
      
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!adminId && isValidUUID(adminId) && isSupabaseAvailable(),
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: CompanyForm & { admin_id: string }) => {
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyData,
          settings: {
            messaging: {
              whatsapp_enabled: false,
              facebook_enabled: false,
              viber_enabled: false,
              auto_reply_enabled: false,
            },
            branding: {},
            lead_scoring: {
              source_weights: {
                whatsapp: 8,
                facebook: 6,
                viber: 5,
                website: 7,
                referral: 9,
                manual: 4,
              },
              activity_weights: {
                call: 5,
                message: 3,
                email: 2,
                meeting: 8,
                site_visit: 10,
              },
            },
            notifications: {
              email_enabled: true,
              sms_enabled: false,
              push_enabled: true,
            },
          },
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`Company "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create company');
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`Company "${data.name}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update company');
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete company');
    },
  });
};

// Company Statistics
export const useCompanyStats = (adminId?: string) => {
  return useQuery({
    queryKey: ['company-stats', adminId],
    queryFn: async () => {
      if (!isSupabaseAvailable()) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, status, subscription_plan, created_at')
        .eq('admin_id', adminId);
      
      if (error) throw error;
      
      const stats = {
        total: companies.length,
        active: companies.filter(c => c.status === 'active').length,
        trial: companies.filter(c => c.status === 'trial').length,
        inactive: companies.filter(c => c.status === 'inactive').length,
        thisMonth: companies.filter(c => {
          const created = new Date(c.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length,
        byPlan: {
          trial: companies.filter(c => c.subscription_plan === 'trial').length,
          basic: companies.filter(c => c.subscription_plan === 'basic').length,
          professional: companies.filter(c => c.subscription_plan === 'professional').length,
          enterprise: companies.filter(c => c.subscription_plan === 'enterprise').length,
        },
      };
      
      return stats;
    },
    enabled: !!adminId && isSupabaseAvailable(),
  });
};