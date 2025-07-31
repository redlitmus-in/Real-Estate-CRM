import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuthActions } from '../../store/authStore';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithSupabase } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'company'>('company');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company_slug: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      await loginWithSupabase(formData.email, formData.password);
      
      if (loginType === 'admin') {
        toast.success('Welcome back, Administrator!');
        navigate('/admin/dashboard');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PropConnect</h1>
          <p className="text-gray-600 mt-2">Multi-Tenant Real Estate CRM</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            
            {/* Login Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'admin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                System Admin
              </button>
              <button
                type="button"
                onClick={() => setLoginType('company')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'company'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company User
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="Enter your email address"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Enter your password"
                required
              />

              {loginType === 'company' && (
                <Input
                  label="Company Slug"
                  type="text"
                  name="company_slug"
                  value={formData.company_slug}
                  onChange={handleInputChange}
                  leftIcon={<User className="h-4 w-4" />}
                  placeholder="Your company's unique identifier"
                  helperText="Optional: Your company's unique identifier"
                />
              )}

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Contact your system administrator for account access</div>
                <div>• Make sure you're using the correct email and password</div>
                <div>• Check that your account is active and not suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};