import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Target,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLeads, useDeleteLead, useLeadStats } from '../../hooks/useLeads';
import { useAuth } from '../../store/authStore';
import { formatDate, formatCurrency, getLeadStageColor } from '../../lib/utils';
import { Lead } from '../../types';
import { supabase } from '../../lib/supabase';
import { LeadForm } from './LeadForm';

export const LeadManagement: React.FC = () => {
  const { currentCompany } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Use the correct company ID - fallback to the database company ID if currentCompany is not set
  const companyId = currentCompany?.id || '550e8400-e29b-41d4-a716-446655440001';
  
  console.log('LeadManagement - currentCompany:', currentCompany);
  console.log('LeadManagement - using companyId:', companyId);

  const { data: leads = [], isLoading } = useLeads(companyId);
  const { data: stats } = useLeadStats(companyId);
  const deleteLeadMutation = useDeleteLead();

  console.log('LeadManagement - leads:', leads);
  console.log('LeadManagement - stats:', stats);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      (lead.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       lead.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       lead.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStage && matchesSource;
  });

  const handleDeleteLead = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete this lead? This action cannot be undone.`)) {
      await deleteLeadMutation.mutateAsync(lead.id);
      setShowDropdown(null);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-100 text-green-800',
      facebook: 'bg-blue-100 text-blue-800',
      viber: 'bg-purple-100 text-purple-800',
      website: 'bg-orange-100 text-orange-800',
      referral: 'bg-yellow-100 text-yellow-800',
      manual: 'bg-gray-100 text-gray-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityIcon = (score: number) => {
    if (score >= 80) return <Target className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <UserCheck className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Track and manage your sales pipeline</p>
        </div>
        <Button onClick={() => {
          setSelectedLead(null);
          setShowLeadForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-green-600">+{stats.thisMonth} this month</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Value Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highValueLeads}</p>
                  <p className="text-sm text-green-600">Score 80+</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-blue-600">Closed won rate</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Lead Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                  <p className="text-sm text-orange-600">Quality metric</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stages</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="facebook">Facebook</option>
                <option value="viber">Viber</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="manual">Manual</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Pipeline ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leads found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSelectedLead(null);
                  setShowLeadForm(true);
                }}
              >
                Create your first lead
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center">
                      {getPriorityIcon(lead.score)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {lead.customer?.name || 'Unknown Customer'}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeadStageColor(lead.stage)}`}>
                          {lead.stage.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        {lead.customer?.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {lead.customer.phone}
                          </div>
                        )}
                        {lead.customer?.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {lead.customer.email}
                          </div>
                        )}
                        {lead.next_follow_up && (
                          <div className="flex items-center text-sm text-orange-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Follow up: {formatDate(lead.next_follow_up)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        {lead.property?.title && (
                          <p className="text-sm text-blue-600 font-medium">
                            🏠 {lead.property.title}
                          </p>
                        )}
                        {lead.budget_min && lead.budget_max && (
                          <p className="text-sm text-gray-600">
                            💰 Budget: {formatCurrency(lead.budget_min)} - {formatCurrency(lead.budget_max)}
                          </p>
                        )}
                        {lead.notes && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {lead.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(lead.source)}`}>
                          {lead.source}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created {formatDate(lead.created_at)}
                      </p>
                      {lead.assigned_user?.name && (
                        <p className="text-xs text-blue-600">
                          Assigned to {lead.assigned_user.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDropdown(showDropdown === lead.id ? null : lead.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {showDropdown === lead.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadForm(true);
                              setShowDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="mr-3 h-4 w-4" />
                            Edit Lead
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete Lead
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

      {/* Lead Form Modal/Overlay */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="p-6">
              <LeadForm 
                lead={selectedLead}
                onClose={() => {
                  setShowLeadForm(false);
                  setSelectedLead(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};