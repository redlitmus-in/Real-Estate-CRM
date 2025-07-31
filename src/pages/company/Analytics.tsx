import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  Zap
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
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCustomerStats } from '../../hooks/useCustomers';
import { useLeadStats } from '../../hooks/useLeads';
import { usePropertyStats } from '../../hooks/useProperties';
import { useMessagingStats } from '../../hooks/useMessaging';
import { useAuth } from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';

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

export const Analytics: React.FC = () => {
  const { currentCompany } = useAuth();
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'revenue' | 'performance'>('overview');

  const { data: customerStats } = useCustomerStats(currentCompany?.id);
  const { data: leadStats } = useLeadStats(currentCompany?.id);
  const { data: propertyStats } = usePropertyStats(currentCompany?.id);
  const { data: messagingStats } = useMessagingStats(currentCompany?.id);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Mock data for comprehensive charts
  const mockRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200000, 1350000, 1420000, 1580000, 1650000, 1720000, 1850000, 1920000, 2050000, 2180000, 2250000, 2380000],
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
        label: 'Target',
        data: [1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000],
        borderColor: 'rgba(239, 68, 68, 0.6)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const mockLeadConversionData = {
    labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'],
    datasets: [
      {
        label: 'Leads',
        data: [150, 120, 85, 65, 45, 32],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const mockSourcePerformanceData = {
    labels: ['WhatsApp', 'Facebook', 'Website', 'Referral', 'Viber', 'Manual'],
    datasets: [
      {
        label: 'Lead Sources',
        data: [45, 32, 28, 18, 12, 8],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(107, 114, 128, 1)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const mockPerformanceRadarData = {
    labels: ['Lead Quality', 'Response Time', 'Conversion Rate', 'Customer Satisfaction', 'Revenue Growth', 'Market Reach'],
    datasets: [
      {
        label: 'Current Performance',
        data: [85, 78, 92, 88, 95, 82],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Target Performance',
        data: [90, 85, 95, 90, 100, 88],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const mockLeadQualityData = {
    labels: ['High Value', 'Medium Value', 'Low Value'],
    datasets: [
      {
        label: 'Lead Quality Distribution',
        data: [35, 45, 20],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const mockTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Lead Generation',
        data: [120, 135, 142, 158, 165, 172, 185, 192, 205, 218, 225, 238],
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
        label: 'Conversions',
        data: [25, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 98],
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
              return `${context.dataset.label}: ₹${(context.parsed.y / 100000).toFixed(1)}L`;
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

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          stepSize: 20,
        },
        pointLabels: {
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



  const kpiMetrics = [
    {
      title: 'Total Revenue',
      value: propertyStats ? `${formatCurrency(propertyStats.totalValue / 10000000)}Cr` : '₹0',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Lead Conversion',
      value: leadStats ? `${leadStats.conversionRate.toFixed(1)}%` : '0%',
      change: '+2.3%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Customer Growth',
      value: customerStats?.thisMonth.toString() || '0',
      change: '+18.2%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Response Time',
      value: messagingStats ? `${messagingStats.responseTime}m` : '0m',
      change: '-5.1%',
      trend: 'down',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Advanced business intelligence with interactive visualizations</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change} from last period
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'leads', label: 'Lead Analytics', icon: '🎯' },
          { key: 'revenue', label: 'Revenue Trends', icon: '💰' },
          { key: 'performance', label: 'Performance', icon: '⚡' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-lg border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="mr-2 text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Area Chart */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Revenue Growth Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={mockRevenueData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Lead Sources Doughnut */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <span>Lead Sources Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut data={mockSourcePerformanceData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Conversion Funnel */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Lead Conversion Funnel</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={mockLeadConversionData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

                         {/* Lead Quality Distribution */}
             <Card className="hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <CardTitle className="flex items-center space-x-2">
                   <Activity className="h-5 w-5 text-orange-600" />
                   <span>Lead Quality Distribution</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-80">
                   <Doughnut data={mockLeadQualityData} options={chartOptions} />
                 </div>
               </CardContent>
             </Card>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Target */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Revenue vs Target</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={mockRevenueData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Performance Radar */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Radar data={mockPerformanceRadarData} options={radarOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Lead Generation Trends */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Lead Generation & Conversion Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <Line data={mockTrendData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Sources Performance */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    <span>Lead Sources Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Doughnut data={mockSourcePerformanceData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Radar */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Performance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Radar data={mockPerformanceRadarData} options={radarOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};