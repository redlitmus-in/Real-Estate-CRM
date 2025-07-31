import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Calendar,
  Globe,
  Phone,
  Mail,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCompanies, useDeleteCompany, useCompanyStats } from '../../hooks/useSupabase';
import { useAuth } from '../../store/authStore';
import { formatDate, getInitials } from '../../lib/utils';
import { CompanyForm } from './CompanyForm';
import { Company } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const CompanyManagement: React.FC = () => {
  const { admin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useCompanies(admin?.id);
  const { data: stats } = useCompanyStats(admin?.id);
  const deleteCompanyMutation = useDeleteCompany();

  // Chart data configurations
  const companyGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Companies',
        data: [8, 12, 15, 18, 22, 25],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
      },
      {
        label: 'Active Companies',
        data: [32, 35, 38, 41, 43, 45],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
      }
    ]
  };

  const subscriptionData = {
    labels: ['Basic', 'Pro', 'Enterprise', 'Trial'],
    datasets: [
      {
        label: 'Subscription Plans',
        data: [20, 18, 7, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const companyPerformanceData = {
    labels: ['Prime Properties', 'Elite Homes', 'Urban Realty', 'Skyline Properties', 'Metro Estates'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [25000, 18000, 15000, 8000, 6000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        padding: 16,
        titleFont: {
          size: 14,
          weight: '700',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          weight: '500',
          family: 'Inter, system-ui, sans-serif'
        },
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Monthly Revenue') {
              return `${context.dataset.label}: ₹${(context.parsed.y / 1000).toFixed(0)}K`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          callback: function(value: any) {
            if (value >= 1000) {
              return `₹${(value / 1000).toFixed(0)}K`;
            }
            return value;
          }
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280'
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 12,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff',
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
        }
      }
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteCompany = async (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.name}?`)) {
      await deleteCompanyMutation.mutateAsync(company.id);
    }
  };

  if (showCreateForm) {
    return (
      <CompanyForm
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
        }}
      />
    );
  }

  if (editingCompany) {
    return (
      <CompanyForm
        company={editingCompany}
        onClose={() => {
          setEditingCompany(null);
        }}
        onSuccess={() => {
          setEditingCompany(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-600">Manage all real estate companies in your platform</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-green-600">+{stats.thisMonth} this month</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-sm text-gray-500">{((stats.active / stats.total) * 100).toFixed(1)}% of total</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trial Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
                  <p className="text-sm text-blue-600">Potential conversions</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enterprise Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byPlan.enterprise}</p>
                  <p className="text-sm text-purple-600">Premium customers</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Growth Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Company Growth Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line key="company-growth-chart" data={companyGrowthData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>Subscription Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut key="subscription-chart" data={subscriptionData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Performance Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>Top Performing Companies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar key="performance-chart" data={companyPerformanceData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="trial">Trial</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No companies found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {getInitials(company.name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : company.status === 'trial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {company.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{company.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{company.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>Plan: {company.subscription_plan}</span>
                        <span>Created: {formatDate(company.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompany(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDropdown(showDropdown === company.id ? null : company.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {showDropdown === company.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleDeleteCompany(company)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Company</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};