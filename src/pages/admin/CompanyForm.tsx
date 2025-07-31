import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateCompany, useUpdateCompany } from '../../hooks/useSupabase';
import { useAuth } from '../../store/authStore';
import { Company } from '../../types';
import { generateSlug } from '../../lib/utils';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    postal_code: z.string().optional(),
  }).optional(),
  subscription_plan: z.enum(['trial', 'basic', 'professional', 'enterprise']),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company | null;
  onClose: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onClose }) => {
  const { admin } = useAuth();
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      slug: company?.slug || '',
      email: company?.email || '',
      phone: company?.phone || '',
      website: company?.website || '',
      address: {
        street: company?.address?.street || '',
        city: company?.address?.city || '',
        state: company?.address?.state || '',
        country: company?.address?.country || 'India',
        postal_code: company?.address?.postal_code || '',
      },
      subscription_plan: company?.subscription_plan || 'trial',
    },
  });

  const watchedName = watch('name');

  // Auto-generate slug from name
  React.useEffect(() => {
    if (watchedName && !company) {
      const slug = generateSlug(watchedName);
      setValue('slug', slug);
    }
  }, [watchedName, setValue, company]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (company) {
        await updateCompanyMutation.mutateAsync({
          id: company.id,
          ...data,
        });
      } else {
        await createCompanyMutation.mutateAsync({
          ...data,
          admin_id: admin!.id,
        });
      }
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {company ? 'Edit Company' : 'Create New Company'}
          </h1>
          <p className="text-gray-600">
            {company ? 'Update company information and settings' : 'Add a new real estate company to your platform'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="ABC Real Estate"
              />
              <Input
                label="Slug *"
                {...register('slug')}
                error={errors.slug?.message}
                placeholder="abc-real-estate"
                helperText="Used in URLs and must be unique"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="info@abcrealestate.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Website"
              {...register('website')}
              error={errors.website?.message}
              placeholder="https://www.abcrealestate.com"
              leftIcon={<Globe className="h-4 w-4" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Plan *
              </label>
              <select
                {...register('subscription_plan')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="trial">Trial (Free for 30 days)</option>
                <option value="basic">Basic (₹2,999/month)</option>
                <option value="professional">Professional (₹5,999/month)</option>
                <option value="enterprise">Enterprise (₹12,999/month)</option>
              </select>
              {errors.subscription_plan && (
                <p className="mt-1 text-sm text-red-600">{errors.subscription_plan.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Address Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address"
              {...register('address.street')}
              error={errors.address?.street?.message}
              placeholder="123 Business District"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                {...register('address.city')}
                error={errors.address?.city?.message}
                placeholder="Bangalore"
              />
              <Input
                label="State"
                {...register('address.state')}
                error={errors.address?.state?.message}
                placeholder="Karnataka"
              />
              <Input
                label="Postal Code"
                {...register('address.postal_code')}
                error={errors.address?.postal_code?.message}
                placeholder="560001"
              />
            </div>

            <Input
              label="Country"
              {...register('address.country')}
              error={errors.address?.country?.message}
              placeholder="India"
              disabled
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting || createCompanyMutation.isPending || updateCompanyMutation.isPending}
          >
            {company ? 'Update Company' : 'Create Company'}
          </Button>
        </div>
      </form>
    </div>
  );
};