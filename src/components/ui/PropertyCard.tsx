import React from 'react';
import { MapPin, Home, Maximize, IndianRupee, Star, Bed, Bath, Car } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  bhk_type: string;
  area_sqft: string;
  price_min: number;
  price_max: number;
  location: {
    address: {
      city: string;
      state: string;
      street?: string;
    };
    locality: string;
    nearby_facilities?: string[];
  };
  amenities: string[];
  images?: string[];
  status: string;
}

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, compact = false }) => {
  const formatPrice = (min: number, max?: number) => {
    const minPrice = (min / 100000).toFixed(1);
    const maxPrice = max ? (max / 100000).toFixed(1) : null;
    
    if (maxPrice && minPrice !== maxPrice) {
      return `₹${minPrice}L - ₹${maxPrice}L`;
    }
    return `₹${minPrice}L`;
  };

  const getPropertyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'villa':
        return <Home className="h-4 w-4" />;
      case 'apartment':
        return <Bed className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'villa':
        return 'bg-green-100 text-green-800';
      case 'apartment':
        return 'bg-blue-100 text-blue-800';
      case 'plot':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          {/* Property Image Placeholder */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {getPropertyIcon(property.type)}
            <span className="text-white text-xs font-medium ml-1">
              {property.bhk_type}
            </span>
          </div>
          
          {/* Property Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {property.title}
              </h4>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(property.type)}`}>
                {property.type}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">
                {property.location.locality}, {property.location.address.city}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <Maximize className="h-3 w-3 mr-1" />
                  {property.area_sqft} sq ft
                </div>
              </div>
              <div className="text-sm font-bold text-green-600">
                {formatPrice(property.price_min, property.price_max)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            {getPropertyIcon(property.type)}
            <div className="mt-2 text-lg font-bold">{property.bhk_type}</div>
            <div className="text-sm opacity-90">{property.type}</div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            {property.status}
          </span>
        </div>
        
        {/* Type Badge */}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(property.type)}`}>
            {property.type}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        {/* Title and Price */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
            {property.title}
          </h3>
          <div className="ml-4 text-right">
            <div className="text-xl font-bold text-green-600">
              {formatPrice(property.price_min, property.price_max)}
            </div>
            <div className="text-xs text-gray-500">Total Price</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm">
            {property.location.locality}, {property.location.address.city}, {property.location.address.state}
          </span>
        </div>

        {/* Property Specs */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {property.bhk_type}
          </div>
          <div className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            {property.area_sqft} sq ft
          </div>
          {property.amenities.includes('Parking') && (
            <div className="flex items-center">
              <Car className="h-4 w-4 mr-1" />
              Parking
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {property.description}
        </p>

        {/* Amenities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {property.amenities.slice(0, 4).map((amenity, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 4 && (
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                +{property.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Nearby Facilities */}
        {property.location.nearby_facilities && property.location.nearby_facilities.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Nearby Facilities</p>
            <div className="flex flex-wrap gap-1">
              {property.location.nearby_facilities.slice(0, 3).map((facility, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            View Details
          </button>
          <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
            Schedule Visit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;