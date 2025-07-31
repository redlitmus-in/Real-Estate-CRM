import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserCheck, Mail, Phone, MessageSquare, MapPin, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useAuth } from '../../store/authStore';
import { Customer } from '../../types';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  whatsapp_number: z.string().optional(),
  alternate_phone: z.string().optional(),
  source: z.enum(['manual', 'whatsapp', 'facebook', 'viber', 'website', 'referral', 'advertisement']),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    postal_code: z.string().optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer | null;
  onClose: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose }) => {
  const { currentCompany } = useAuth();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const [tagInput, setTagInput] = React.useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      whatsapp_number: customer?.whatsapp_number || '',
      alternate_phone: customer?.alternate_phone || '',
      source: customer?.source || 'manual',
      tags: customer?.tags || [],
      notes: customer?.notes || '',
      address: {
        street: customer?.address?.street || '',
        city: customer?.address?.city || '',
        state: customer?.address?.state || '',
        country: customer?.address?.country || 'India',
        postal_code: customer?.address?.postal_code || '',
      },
      status: customer?.status || 'active',
    },
  });

  const watchedTags = watch('tags');

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const customerData = {
        ...data,
        lead_score: customer?.lead_score || 0,
        preferences: customer?.preferences || {},
      };

      if (customer) {
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          ...customerData,
        });
      } else {
        await createCustomerMutation.mutateAsync({
          ...customerData,
          company_id: currentCompany!.id,
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
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-gray-600">
            {customer ? 'Update customer information and details' : 'Add a new customer to your database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name *"
              {...register('name')}
              error={errors.name?.message}
              placeholder="John Doe"
              leftIcon={<UserCheck className="h-4 w-4" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Primary Phone"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="john@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="WhatsApp Number"
                {...register('whatsapp_number')}
                error={errors.whatsapp_number?.message}
                placeholder="+91 98765 43210"
                leftIcon={<MessageSquare className="h-4 w-4" />}
                helperText="For WhatsApp messaging"
              />
              <Input
                label="Alternate Phone"
                {...register('alternate_phone')}
                error={errors.alternate_phone?.message}
                placeholder="+91 87654 32109"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <select
                  {...register('source')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="facebook">Facebook</option>
                  <option value="viber">Viber</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="advertisement">Advertisement</option>
                </select>
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Tags & Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any additional notes about this customer..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
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
              placeholder="123 Main Street"
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
            loading={isSubmitting || createCustomerMutation.isPending || updateCustomerMutation.isPending}
          >
            {customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
};