import React from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  MessageSquare,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../../store/authStore';
import { useCompanies, useCompanyStats } from '../../hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatDate, getInitials } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AdminDashboard: React.FC = () => {
  const { admin } = useAuth();
  const { data: companies = [] } = useCompanies(admin?.id);
  const { data: stats } = useCompanyStats(admin?.id);

  // Platform Activity Chart Data
  const platformActivityData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'User Activity',
        data: [45, 32, 78, 156, 234, 189, 67],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: 'y',
      },
      {
        label: 'Message Volume',
        data: [120, 89, 234, 456, 678, 543, 234],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: 'y1',
      },
      {
        label: 'System Load',
        data: [12, 8, 15, 25, 35, 28, 18],
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: 'y2',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
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
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    scales: {
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
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
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
            return `${value} users`;
          }
        },
        border: {
          display: false
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          callback: function(value: any) {
            return `${value} msgs`;
          }
        },
        border: {
          display: false
        }
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          callback: function(value: any) {
            return `${value}%`;
          }
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
      }
    }
  };

  const dashboardStats = [
    {
      title: 'Total Companies',
      value: stats?.total.toString() || '0',
      change: `+${stats?.thisMonth || 0} this month`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: '1,247', // This will be calculated from users table later
      change: '+12% from last month',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Revenue',
      value: '₹4,85,000',
      change: '+8% from last month',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Messages Processed',
      value: '45,678',
      change: '+23% from last month',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentCompanies = companies?.slice(0, 4).map(company => ({
    id: company.id,
    name: company.name,
    plan: company.subscription_plan,
    users: 0, // Will be calculated from users table later
    status: company.status,
    created: formatDate(company.created_at),
  })) || [];

  const displayCompanies = recentCompanies;

  const systemHealth = [
    { service: 'API Gateway', status: 'healthy', uptime: '99.9%' },
    { service: 'Database', status: 'healthy', uptime: '99.8%' },
    { service: 'WhatsApp Service', status: 'warning', uptime: '98.5%' },
    { service: 'Message Queue', status: 'healthy', uptime: '99.7%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600">Monitor and manage your multi-tenant CRM platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getInitials(company.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.users} users • {company.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{company.created}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service) => (
                <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{service.service}</p>
                      <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    service.status === 'healthy' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Activity Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Platform Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={platformActivityData} options={chartOptions} />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Peak Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">234</p>
              <p className="text-sm text-gray-600">at 16:00</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Message Volume</span>
              </div>
              <p className="text-2xl font-bold text-green-600">678</p>
              <p className="text-sm text-gray-600">peak messages</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">System Load</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">35%</p>
              <p className="text-sm text-gray-600">optimal performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};