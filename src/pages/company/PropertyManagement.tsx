import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Ruler,
  DollarSign,
  Calendar,
  Home,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useProperties, useDeleteProperty, usePropertyStats } from '../../hooks/useProperties';
import { useAuth } from '../../store/authStore';
import { formatDate, formatCurrency, getPropertyTypeIcon } from '../../lib/utils';
import { Property } from '../../types';

export const PropertyManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useProperties(currentCompany?.id);
  const { data: stats } = usePropertyStats(currentCompany?.id);
  const deletePropertyMutation = useDeleteProperty();

  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchTerm === '' || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.locality?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteProperty = async (property: Property) => {
    if (window.confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      await deletePropertyMutation.mutateAsync(property.id);
      setShowDropdown(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      sold: 'bg-red-100 text-red-800',
      rented: 'bg-blue-100 text-blue-800',
      under_construction: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      apartment: 'bg-blue-100 text-blue-800',
      villa: 'bg-green-100 text-green-800',
      plot: 'bg-yellow-100 text-yellow-800',
      commercial: 'bg-purple-100 text-purple-800',
      warehouse: 'bg-orange-100 text-orange-800',
      office: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600">Manage your property inventory and listings</p>
        </div>
        <Button onClick={() => navigate('/properties/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-green-600">+{stats.thisMonth} this month</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
                  <p className="text-sm text-gray-500">{((stats.available / stats.total) * 100).toFixed(1)}% of total</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Home className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue / 10000000)}Cr</p>
                  <p className="text-sm text-purple-600">Portfolio value</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Price</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice / 1000000)}L</p>
                  <p className="text-sm text-orange-600">Per property</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Building className="h-6 w-6 text-yellow-600" />
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
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
                <option value="warehouse">Warehouse</option>
                <option value="office">Office</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="under_construction">Under Construction</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Property Inventory ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No properties found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/properties/new')}>
                Add your first property
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Property Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                        {property.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/80 hover:bg-white"
                        onClick={() => setShowDropdown(showDropdown === property.id ? null : property.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {showDropdown === property.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                          <button
                            onClick={() => {
                              navigate(`/properties/edit/${property.id}`);
                              setShowDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="mr-3 h-4 w-4" />
                            Edit Property
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete Property
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                        {property.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(property.type)} ml-2`}>
                        {property.type}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.location.locality}, {property.location.address.city}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      {property.bhk_type && (
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1" />
                          {property.bhk_type}
                        </div>
                      )}
                      {property.area_sqft && (
                        <div className="flex items-center">
                          <Ruler className="h-4 w-4 mr-1" />
                          {property.area_sqft} sqft
                        </div>
                      )}
                      {property.rera_number && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          RERA
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(property.price_min)} - {formatCurrency(property.price_max)}
                        </div>
                        {property.price_per_sqft && (
                          <div className="text-sm text-gray-500">
                            ₹{property.price_per_sqft}/sqft
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Added {formatDate(property.created_at)}
                        </div>
                        {property.possession_date && (
                          <div className="text-xs text-blue-600">
                            Possession: {formatDate(property.possession_date)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {property.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{property.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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