import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  MessageSquare,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter
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
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

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
  ArcElement,
  RadialLinearScale
);

export const SystemAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock analytics data - replace with actual data fetching
  const systemMetrics = {
    totalRevenue: 2450000,
    totalUsers: 1247,
    totalCompanies: 45,
    messagesProcessed: 45678,
    growthMetrics: {
      revenue: 12.5,
      users: 8.3,
      companies: 15.2,
      messages: 23.1
    }
  };

  // Chart data configurations
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Users',
        data: [850, 920, 1050, 1120, 1200, 1247],
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
        label: 'Companies',
        data: [32, 35, 38, 41, 43, 45],
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
      }
    ]
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [185000, 195000, 220000, 235000, 245000, 250000],
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
    labels: ['Basic', 'Pro', 'Enterprise'],
    datasets: [
      {
        label: 'Subscription Plans',
        data: [20, 18, 7],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const topCompaniesData = {
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
            if (context.dataset.label === 'Revenue') {
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
            if (value >= 1000000) {
              return `₹${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `₹${(value / 1000).toFixed(0)}K`;
            }
            return value.toLocaleString();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const topCompanies = [
    { name: 'Prime Properties', users: 45, revenue: 25000, plan: 'Enterprise' },
    { name: 'Elite Homes', users: 32, revenue: 18000, plan: 'Pro' },
    { name: 'Urban Realty', users: 28, revenue: 15000, plan: 'Pro' },
    { name: 'Skyline Properties', users: 15, revenue: 8000, plan: 'Basic' },
    { name: 'Metro Estates', users: 12, revenue: 6000, plan: 'Basic' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600">Monitor platform performance and growth metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(systemMetrics.totalRevenue)}</p>
                <p className="text-sm text-green-600">+{systemMetrics.growthMetrics.revenue}% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{systemMetrics.growthMetrics.users}% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalCompanies}</p>
                <p className="text-sm text-green-600">+{systemMetrics.growthMetrics.companies}% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Processed</p>
                <p className="text-2xl font-bold text-gray-900">{systemMetrics.messagesProcessed.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{systemMetrics.growthMetrics.messages}% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>User & Company Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Users</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{userGrowthData.datasets[0].data[userGrowthData.datasets[0].data.length - 1]}</p>
                <p className="text-sm text-gray-600">Current Total</p>
              </div>
              <div className="text-center bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Companies</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{userGrowthData.datasets[1].data[userGrowthData.datasets[1].data.length - 1]}</p>
                <p className="text-sm text-gray-600">Current Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Revenue Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={revenueData} options={chartOptions} />
            </div>
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Monthly Revenue Trend</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₹{formatCurrency(revenueData.datasets[0].data[revenueData.datasets[0].data.length - 1])}</p>
                  <p className="text-sm text-gray-600">Current Month</p>
                </div>
              </div>
              
              {/* Growth Indicator */}
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">
                    +{(((revenueData.datasets[0].data[revenueData.datasets[0].data.length - 1] - revenueData.datasets[0].data[0]) / revenueData.datasets[0].data[0]) * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-sm text-gray-500">growth since {revenueData.labels[0]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>Subscription Plans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={subscriptionData} options={doughnutOptions} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{subscriptionData.datasets[0].data[0]}</div>
                <div className="text-xs text-blue-700">Basic Users</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{subscriptionData.datasets[0].data[1]}</div>
                <div className="text-xs text-green-700">Pro Users</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{subscriptionData.datasets[0].data[2]}</div>
                <div className="text-xs text-purple-700">Enterprise</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>Top Performing Companies</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 mb-4">
              <Bar data={topCompaniesData} options={chartOptions} />
            </div>
            <div className="space-y-3">
              {topCompanies.map((company, index) => (
                <div key={company.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.users} users • {company.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{formatCurrency(company.revenue)}</p>
                    <p className="text-sm text-gray-500">monthly</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <span>Recent Activity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">142</p>
              <p className="text-sm text-gray-600">New users this week</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-sm text-gray-600">New companies this week</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">12.5K</p>
              <p className="text-sm text-gray-600">Messages processed this week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};