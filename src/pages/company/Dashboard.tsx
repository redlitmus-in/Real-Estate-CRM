import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Building2, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Target,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCustomerStats } from '../../hooks/useCustomers';
import { useLeadStats } from '../../hooks/useLeads';
import { usePropertyStats } from '../../hooks/useProperties';
import { useAuth } from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';
import LeadPerformanceChart from '../../components/LeadPerformanceChart';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany } = useAuth();
  const { data: customerStats } = useCustomerStats(currentCompany?.id);
  const { data: leadStats } = useLeadStats(currentCompany?.id);
  const { data: propertyStats } = usePropertyStats(currentCompany?.id);

  const stats = [
    {
      title: 'Total Customers',
      value: customerStats?.total.toString() || '0',
      change: `+${customerStats?.thisMonth || 0} this month`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Leads',
      value: leadStats?.active.toString() || '0',
      change: `+${leadStats?.thisMonth || 0} this month`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Properties Listed',
      value: propertyStats?.total.toString() || '0',
      change: `+${propertyStats?.thisMonth || 0} this month`,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Portfolio Value',
      value: propertyStats ? `${formatCurrency(propertyStats.totalValue / 10000000)}Cr` : '₹0',
      change: `Avg: ${propertyStats ? formatCurrency(propertyStats.averagePrice / 1000000) : '₹0'}L`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentLeads = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      source: 'WhatsApp',
      property: '2BHK Apartment',
      stage: 'qualified',
      score: 85,
      time: '2 hours ago',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      phone: '+91 87654 32109',
      source: 'Facebook',
      property: 'Villa in Whitefield',
      stage: 'contacted',
      score: 72,
      time: '4 hours ago',
    },
    {
      id: '3',
      name: 'Amit Patel',
      phone: '+91 76543 21098',
      source: 'Website',
      property: 'Commercial Plot',
      stage: 'new',
      score: 68,
      time: '6 hours ago',
    },
  ];

  const upcomingTasks = [
    {
      id: '1',
      title: 'Follow up with Rajesh Kumar',
      type: 'call',
      time: '2:00 PM',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Site visit with Priya Sharma',
      type: 'meeting',
      time: '4:30 PM',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Send property brochure to Amit',
      type: 'email',
      time: '6:00 PM',
      priority: 'low',
    },
  ];

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-l-red-500',
      medium: 'border-l-yellow-500',
      low: 'border-l-green-500',
    };
    return colors[priority] || 'border-l-gray-500';
  };

  const getTaskIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
    };
    return icons[type] || <Calendar className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        <Button onClick={() => navigate('/messages')}>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
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
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {lead.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.phone}</p>
                      <p className="text-xs text-gray-400">{lead.property} • {lead.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(lead.stage)}`}>
                      {lead.stage}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Score: {lead.score}</p>
                    <p className="text-xs text-gray-400">{lead.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/leads')}
              >
                View All Leads
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className={`p-3 bg-gray-50 rounded-lg border-l-4 ${getPriorityColor(task.priority)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/analytics')}
              >
                View All Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <LeadPerformanceChart />
    </div>
  );
};