import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Phone, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useAuth } from '../../store/authStore';
import { User as UserType } from '../../types';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'agent', 'viewer']),
  status: z.enum(['active', 'inactive', 'suspended']),
  permissions: z.array(z.string()).default([]),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: UserType | null;
  onClose: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const { currentCompany } = useAuth();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'agent',
      status: user?.status || 'active',
      permissions: user?.permissions || [],
    },
  });

  const watchedRole = watch('role');

  // Set default permissions based on role
  React.useEffect(() => {
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      manager: [
        'users:read', 'users:write',
        'customers:read', 'customers:write',
        'leads:read', 'leads:write',
        'properties:read', 'properties:write',
        'messages:read', 'messages:write',
        'analytics:read'
      ],
      agent: [
        'customers:read', 'customers:write',
        'leads:read', 'leads:write',
        'properties:read',
        'messages:read', 'messages:write'
      ],
      viewer: [
        'customers:read',
        'leads:read',
        'properties:read',
        'messages:read'
      ],
    };

    if (!user) { // Only set default permissions for new users
      setValue('permissions', rolePermissions[watchedRole] || []);
    }
  }, [watchedRole, setValue, user]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (user) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          ...data,
        });
      } else {
        await createUserMutation.mutateAsync({
          ...data,
          company_id: currentCompany!.id,
          profile: {},
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
            {user ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="text-gray-600">
            {user ? 'Update user information and permissions' : 'Add a new team member to your company'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="John Doe"
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label="Email Address *"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="john@company.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Role & Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  {...register('role')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {watchedRole === 'admin' && 'Full access to all features and settings'}
                  {watchedRole === 'manager' && 'Can manage users, customers, leads, and properties'}
                  {watchedRole === 'agent' && 'Can manage customers, leads, and messages'}
                  {watchedRole === 'viewer' && 'Read-only access to data'}
                </p>
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
                  <option value="suspended">Suspended</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Permission Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions Preview</h4>
              <div className="text-sm text-gray-600">
                {watchedRole === 'admin' && (
                  <p>✅ Full system access - All permissions granted</p>
                )}
                {watchedRole === 'manager' && (
                  <div className="space-y-1">
                    <p>✅ User Management (Read/Write)</p>
                    <p>✅ Customer Management (Read/Write)</p>
                    <p>✅ Lead Management (Read/Write)</p>
                    <p>✅ Property Management (Read/Write)</p>
                    <p>✅ Message Management (Read/Write)</p>
                    <p>✅ Analytics (Read)</p>
                  </div>
                )}
                {watchedRole === 'agent' && (
                  <div className="space-y-1">
                    <p>✅ Customer Management (Read/Write)</p>
                    <p>✅ Lead Management (Read/Write)</p>
                    <p>✅ Property Management (Read)</p>
                    <p>✅ Message Management (Read/Write)</p>
                    <p>❌ User Management</p>
                    <p>❌ Analytics</p>
                  </div>
                )}
                {watchedRole === 'viewer' && (
                  <div className="space-y-1">
                    <p>✅ Customer Management (Read)</p>
                    <p>✅ Lead Management (Read)</p>
                    <p>✅ Property Management (Read)</p>
                    <p>✅ Message Management (Read)</p>
                    <p>❌ All Write Operations</p>
                  </div>
                )}
              </div>
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
            loading={isSubmitting || createUserMutation.isPending || updateUserMutation.isPending}
          >
            {user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};