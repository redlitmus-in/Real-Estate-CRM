import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Property } from '../types';
import toast from 'react-hot-toast';

// Properties Management Hooks
export const useProperties = (companyId?: string) => {
  return useQuery({
    queryKey: ['properties', companyId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      let query = supabase.from('properties').select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!companyId && !!supabase,
  });
};

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Property;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create property');
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Property;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update property');
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete property');
    },
  });
};

// Property Statistics
export const usePropertyStats = (companyId?: string) => {
  return useQuery({
    queryKey: ['property-stats', companyId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, type, bhk_type, status, price_min, price_max, created_at')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      const stats = {
        total: properties.length,
        available: properties.filter(p => p.status === 'available').length,
        sold: properties.filter(p => p.status === 'sold').length,
        rented: properties.filter(p => p.status === 'rented').length,
        under_construction: properties.filter(p => p.status === 'under_construction').length,
        thisMonth: properties.filter(p => {
          const created = new Date(p.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length,
        byType: {
          apartment: properties.filter(p => p.type === 'apartment').length,
          villa: properties.filter(p => p.type === 'villa').length,
          plot: properties.filter(p => p.type === 'plot').length,
          commercial: properties.filter(p => p.type === 'commercial').length,
          warehouse: properties.filter(p => p.type === 'warehouse').length,
          office: properties.filter(p => p.type === 'office').length,
        },
        byBHK: {
          '1RK': properties.filter(p => p.bhk_type === '1RK').length,
          '1BHK': properties.filter(p => p.bhk_type === '1BHK').length,
          '2BHK': properties.filter(p => p.bhk_type === '2BHK').length,
          '3BHK': properties.filter(p => p.bhk_type === '3BHK').length,
          '4BHK': properties.filter(p => p.bhk_type === '4BHK').length,
          '5BHK+': properties.filter(p => p.bhk_type === '5BHK+').length,
        },
        averagePrice: properties.length > 0 
          ? Math.round(properties.reduce((sum, p) => sum + ((p.price_min + p.price_max) / 2), 0) / properties.length)
          : 0,
        totalValue: properties.reduce((sum, p) => sum + ((p.price_min + p.price_max) / 2), 0),
        priceRange: {
          min: properties.length > 0 ? Math.min(...properties.map(p => p.price_min)) : 0,
          max: properties.length > 0 ? Math.max(...properties.map(p => p.price_max)) : 0,
        },
      };
      
      return stats;
    },
    enabled: !!companyId && !!supabase,
  });
};