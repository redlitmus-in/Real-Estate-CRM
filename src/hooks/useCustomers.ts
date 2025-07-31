import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import toast from 'react-hot-toast';

// Customers Management Hooks
export const useCustomers = (companyId?: string) => {
  return useQuery({
    queryKey: ['customers', companyId],
    queryFn: async () => {
      let query = supabase.from('customers').select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!companyId,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer "${data.name}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
};

// Customer Statistics
export const useCustomerStats = (companyId?: string) => {
  return useQuery({
    queryKey: ['customer-stats', companyId],
    queryFn: async () => {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, status, source, lead_score, created_at')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      const stats = {
        total: customers.length,
        active: customers.filter(c => c.status === 'active').length,
        inactive: customers.filter(c => c.status === 'inactive').length,
        blacklisted: customers.filter(c => c.status === 'blacklisted').length,
        thisMonth: customers.filter(c => {
          const created = new Date(c.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length,
        bySource: {
          whatsapp: customers.filter(c => c.source === 'whatsapp').length,
          facebook: customers.filter(c => c.source === 'facebook').length,
          viber: customers.filter(c => c.source === 'viber').length,
          website: customers.filter(c => c.source === 'website').length,
          referral: customers.filter(c => c.source === 'referral').length,
          manual: customers.filter(c => c.source === 'manual').length,
          advertisement: customers.filter(c => c.source === 'advertisement').length,
        },
        averageLeadScore: customers.length > 0 
          ? Math.round(customers.reduce((sum, c) => sum + c.lead_score, 0) / customers.length)
          : 0,
        highValueLeads: customers.filter(c => c.lead_score >= 80).length,
      };
      
      return stats;
    },
    enabled: !!companyId,
  });
};