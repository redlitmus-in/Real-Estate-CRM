import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock security data - replace with actual data fetching
  const securityOverview = {
    threatLevel: 'low',
    activeThreats: 2,
    blockedAttempts: 145,
    securityScore: 85,
    lastScan: '2024-01-15T10:30:00Z'
  };

  const securityEvents = [
    {
      id: '1',
      type: 'login_attempt',
      severity: 'high',
      description: 'Multiple failed login attempts detected',
      ip: '192.168.1.100',
      user: 'admin@example.com',
      timestamp: '2024-01-15T10:25:00Z',
      status: 'blocked'
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'medium',
      description: 'Unusual API access pattern detected',
      ip: '10.0.0.50',
      user: 'user@company.com',
      timestamp: '2024-01-15T09:45:00Z',
      status: 'monitoring'
    },
    {
      id: '3',
      type: 'access_granted',
      severity: 'low',
      description: 'Admin access granted to new user',
      ip: '192.168.1.25',
      user: 'newadmin@example.com',
      timestamp: '2024-01-15T08:30:00Z',
      status: 'allowed'
    }
  ];

  const securityPolicies = [
    {
      name: 'Password Policy',
      description: 'Enforce strong password requirements',
      enabled: true,
      settings: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiry: 90
      }
    },
    {
      name: 'Two-Factor Authentication',
      description: 'Require 2FA for admin accounts',
      enabled: true,
      settings: {
        enforceForAdmins: true,
        enforceForManagers: false,
        allowSMS: true,
        allowAuthenticator: true
      }
    },
    {
      name: 'Session Management',
      description: 'Control user session behavior',
      enabled: true,
      settings: {
        sessionTimeout: 60,
        maxConcurrentSessions: 3,
        requireReauth: true
      }
    },
    {
      name: 'API Rate Limiting',
      description: 'Prevent API abuse and DDoS attacks',
      enabled: true,
      settings: {
        requestsPerMinute: 100,
        burstLimit: 200,
        banDuration: 3600
      }
    }
  ];

  const auditLogs = [
    {
      id: '1',
      action: 'User Created',
      user: 'admin@example.com',
      target: 'john.doe@company.com',
      timestamp: '2024-01-15T10:30:00Z',
      ip: '192.168.1.10',
      details: 'Created new user account with Manager role'
    },
    {
      id: '2',
      action: 'Permission Changed',
      user: 'admin@example.com',
      target: 'Company Settings',
      timestamp: '2024-01-15T09:15:00Z',
      ip: '192.168.1.10',
      details: 'Updated company subscription plan settings'
    },
    {
      id: '3',
      action: 'Data Export',
      user: 'manager@company.com',
      target: 'Customer Database',
      timestamp: '2024-01-15T08:45:00Z',
      ip: '10.0.0.25',
      details: 'Exported customer data (500 records)'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked':
        return 'text-red-600 bg-red-100';
      case 'monitoring':
        return 'text-yellow-600 bg-yellow-100';
      case 'allowed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-gray-900">{securityOverview.securityScore}%</p>
                <p className="text-sm text-green-600">Good security posture</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Threats</p>
                <p className="text-2xl font-bold text-gray-900">{securityOverview.activeThreats}</p>
                <p className="text-sm text-yellow-600">Monitoring required</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <ShieldAlert className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{securityOverview.blockedAttempts}</p>
                <p className="text-sm text-blue-600">Last 24 hours</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Security Scan</p>
                <p className="text-lg font-bold text-gray-900">10:30 AM</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Recent Security Events</span>
            </span>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>IP: {event.ip}</span>
                      <span>User: {event.user}</span>
                      <span>Time: {new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      {securityPolicies.map((policy, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{policy.name}</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  policy.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {policy.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Configure</button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{policy.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(policy.settings).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAuditLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Audit Logs</span>
          </span>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Target</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">IP Address</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.target}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">{log.ip}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: 'overview', label: 'Security Overview', icon: Shield },
    { id: 'policies', label: 'Security Policies', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: Eye }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
        <p className="text-gray-600">Monitor and manage platform security settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'policies' && renderPolicies()}
      {activeTab === 'audit' && renderAuditLogs()}
    </div>
  );
};