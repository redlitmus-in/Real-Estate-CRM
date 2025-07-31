import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import toast from 'react-hot-toast';

// Leads Management Hooks
export const useLeads = (companyId?: string) => {
  console.log('useLeads called with companyId:', companyId);
  
  return useQuery({
    queryKey: ['leads', companyId],
    queryFn: async () => {
      console.log('useLeads queryFn executing...');
      
      if (!supabase) {
        console.warn('Supabase not configured, returning empty array');
        return [];
      }

      // Use the correct company ID from the database
      const actualCompanyId = companyId || '550e8400-e29b-41d4-a716-446655440001';
      
      console.log('useLeads - actualCompanyId:', actualCompanyId);
      
      let query = supabase.from('leads').select(`
        *,
        customer:customers(name, phone, email, telegram_id, telegram_username),
        property:properties(title, type, bhk_type),
        assigned_user:users(name, email)
      `);
      
      query = query.eq('company_id', actualCompanyId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log('useLeads - raw query result:', { data, error });
      
      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
      
      console.log('useLeads - fetched leads:', data);
      return data as Lead[] || [];
    },
    enabled: !!companyId || !!supabase,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      if (!supabase) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Database not connected. Please configure Supabase to create leads.');
      }
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create lead');
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      if (!supabase) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Database not connected. Please configure Supabase to update leads.');
      }
      
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Database not connected. Please configure Supabase to delete leads.');
      }
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete lead');
    },
  });
};

// Lead Statistics
export const useLeadStats = (companyId?: string) => {
  console.log('useLeadStats called with companyId:', companyId);
  
  return useQuery({
    queryKey: ['lead-stats', companyId],
    queryFn: async () => {
      console.log('useLeadStats queryFn executing...');
      
      if (!supabase) {
        console.warn('Supabase not configured, returning default stats');
        return {
          total: 0,
          active: 0,
          inactive: 0,
          archived: 0,
          thisMonth: 0,
          byStage: {
            new: 0,
            contacted: 0,
            qualified: 0,
            proposal: 0,
            negotiation: 0,
            closed_won: 0,
            closed_lost: 0,
          },
          bySource: {
            whatsapp: 0,
            facebook: 0,
            viber: 0,
            website: 0,
            referral: 0,
            manual: 0,
            telegram: 0,
          },
          averageScore: 0,
          highValueLeads: 0,
          conversionRate: 0,
        };
      }

      // Use the correct company ID from the database
      const actualCompanyId = companyId || '550e8400-e29b-41d4-a716-446655440001';
      
      console.log('useLeadStats - actualCompanyId:', actualCompanyId);
      
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, stage, source, score, created_at')
        .eq('company_id', actualCompanyId);
      
      console.log('useLeadStats - raw query result:', { leads, error });
      
      if (error) {
        console.error('Error fetching leads for stats:', error);
        throw error;
      }
      
      const stats = {
        total: leads?.length || 0,
        active: leads?.filter(l => l.status === 'active').length || 0,
        inactive: leads?.filter(l => l.status === 'inactive').length || 0,
        archived: leads?.filter(l => l.status === 'archived').length || 0,
        thisMonth: leads?.filter(l => {
          const created = new Date(l.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length || 0,
        byStage: {
          new: leads?.filter(l => l.stage === 'new').length || 0,
          contacted: leads?.filter(l => l.stage === 'contacted').length || 0,
          qualified: leads?.filter(l => l.stage === 'qualified').length || 0,
          proposal: leads?.filter(l => l.stage === 'proposal').length || 0,
          negotiation: leads?.filter(l => l.stage === 'negotiation').length || 0,
          closed_won: leads?.filter(l => l.stage === 'closed_won').length || 0,
          closed_lost: leads?.filter(l => l.stage === 'closed_lost').length || 0,
        },
        bySource: {
          whatsapp: leads?.filter(l => l.source === 'whatsapp').length || 0,
          facebook: leads?.filter(l => l.source === 'facebook').length || 0,
          viber: leads?.filter(l => l.source === 'viber').length || 0,
          website: leads?.filter(l => l.source === 'website').length || 0,
          referral: leads?.filter(l => l.source === 'referral').length || 0,
          manual: leads?.filter(l => l.source === 'manual').length || 0,
          telegram: leads?.filter(l => l.source === 'telegram').length || 0,
        },
        averageScore: leads && leads.length > 0 
          ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
          : 0,
        highValueLeads: leads?.filter(l => l.score >= 80).length || 0,
        conversionRate: leads && leads.length > 0 
          ? ((leads.filter(l => l.stage === 'closed_won').length / leads.length) * 100)
          : 0,
      };
      
      console.log('useLeadStats - calculated stats:', stats);
      return stats;
    },
    enabled: !!companyId || !!supabase,
  });
};