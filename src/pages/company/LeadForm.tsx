import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Target, User, Building2, IndianRupee, FileText, Calendar, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateLead, useUpdateLead } from '../../hooks/useLeads';
import { useCustomers } from '../../hooks/useCustomers';
import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../store/authStore';
import { Lead } from '../../types';

const leadSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  property_id: z.string().optional(),
  source: z.enum(['whatsapp', 'facebook', 'viber', 'telegram', 'manual', 'website', 'referral']),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  requirements: z.object({
    bhk_type: z.string().optional(),
    location_preference: z.string().optional(),
    max_budget: z.number().optional(),
    property_type: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  next_follow_up: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return data.budget_max >= data.budget_min;
  }
  return true;
}, {
  message: "Maximum budget must be greater than minimum budget",
  path: ["budget_max"],
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose }) => {
  const { currentCompany } = useAuth();
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  // Fetch customers and properties for dropdowns
  const { data: customers = [] } = useCustomers(currentCompany?.id);
  const { data: properties = [] } = useProperties(currentCompany?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      customer_id: lead?.customer_id || '',
      property_id: lead?.property_id || '',
      source: lead?.source || 'manual',
      stage: lead?.stage || 'new',
      budget_min: lead?.budget_min || undefined,
      budget_max: lead?.budget_max || undefined,
      requirements: {
        bhk_type: lead?.requirements?.bhk_type || '',
        location_preference: lead?.requirements?.location_preference || '',
        max_budget: lead?.requirements?.max_budget || undefined,
        property_type: lead?.requirements?.property_type || '',
      },
      notes: lead?.notes || '',
      next_follow_up: lead?.next_follow_up ? new Date(lead.next_follow_up).toISOString().slice(0, 16) : '',
      status: lead?.status || 'active',
    },
  });

  const selectedCustomerId = watch('customer_id');
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const onSubmit = async (data: LeadFormData) => {
    try {
      const leadData = {
        ...data,
        budget_min: data.budget_min || null,
        budget_max: data.budget_max || null,
        property_id: data.property_id || null,
        next_follow_up: data.next_follow_up || null,
        requirements: data.requirements || {},
        score: lead?.score || 50, // Default score for new leads
      };

      if (lead) {
        await updateLeadMutation.mutateAsync({
          id: lead.id,
          ...leadData,
        });
      } else {
        await createLeadMutation.mutateAsync({
          ...leadData,
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
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <p className="text-gray-600">
            {lead ? 'Update lead information and details' : 'Create a new lead opportunity'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer & Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Customer & Property</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <select
                  {...register('customer_id')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property (Optional)
                </label>
                <select
                  {...register('property_id')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.type}
                    </option>
                  ))}
                </select>
                {errors.property_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.property_id.message}</p>
                )}
              </div>
            </div>

            {/* Show customer details if selected */}
            {selectedCustomer && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {selectedCustomer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Lead Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="telegram">Telegram</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                </select>
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage *
                </label>
                <select
                  {...register('stage')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
                {errors.stage && (
                  <p className="mt-1 text-sm text-red-600">{errors.stage.message}</p>
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
                  <option value="archived">Archived</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Follow-up
              </label>
              <input
                type="datetime-local"
                {...register('next_follow_up')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.next_follow_up && (
                <p className="mt-1 text-sm text-red-600">{errors.next_follow_up.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget & Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5" />
              <span>Budget & Requirements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Budget (₹)"
                type="number"
                {...register('budget_min', { valueAsNumber: true })}
                error={errors.budget_min?.message}
                placeholder="10,00,000"
                leftIcon={<IndianRupee className="h-4 w-4" />}
                helperText="Enter amount in Indian Rupees"
              />
              <Input
                label="Maximum Budget (₹)"
                type="number"
                {...register('budget_max', { valueAsNumber: true })}
                error={errors.budget_max?.message}
                placeholder="50,00,000"
                leftIcon={<IndianRupee className="h-4 w-4" />}
                helperText="Enter amount in Indian Rupees"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BHK Preference
                </label>
                <select
                  {...register('requirements.bhk_type')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  <option value="1RK">1 RK</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK">4 BHK</option>
                  <option value="5BHK+">5+ BHK</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type Preference
                </label>
                <select
                  {...register('requirements.property_type')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="office">Office</option>
                </select>
              </div>
            </div>

            <Input
              label="Location Preference"
              {...register('requirements.location_preference')}
              error={errors.requirements?.location_preference?.message}
              placeholder="e.g., Whitefield, Koramangala, HSR Layout"
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any additional notes about this lead, conversation history, special requirements, etc."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting || createLeadMutation.isPending || updateLeadMutation.isPending}
          >
            {lead ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
};