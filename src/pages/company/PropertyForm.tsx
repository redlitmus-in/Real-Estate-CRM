import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2, 
  ArrowLeft, 
  Upload, 
  X, 
  MapPin, 
  DollarSign,
  Ruler,
  Home,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateProperty, useUpdateProperty } from '../../hooks/useProperties';
import { useAuth } from '../../store/authStore';
import { Property } from '../../types';
import toast from 'react-hot-toast';

// Custom number validation that handles empty strings
const numberSchema = (message: string) => 
  z.union([
    z.string().transform((val, ctx) => {
      if (val === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
        });
        return z.NEVER;
      }
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid number',
        });
        return z.NEVER;
      }
      if (parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
        });
        return z.NEVER;
      }
      return parsed;
    }),
    z.number().min(1, message)
  ]);

// Form validation schema
const propertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['apartment', 'villa', 'plot', 'commercial', 'warehouse', 'office']),
  sub_type: z.string().optional(),
  bhk_type: z.enum(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']).optional(),
  area_sqft: numberSchema('Area is required'),
  price_min: numberSchema('Minimum price is required'),
  price_max: numberSchema('Maximum price is required'),
  status: z.enum(['available', 'sold', 'rented', 'under_construction', 'inactive']),
  rera_number: z.string().optional(),
  possession_date: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  locality: z.string().min(1, 'Locality is required'),
  landmark: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentCompany } = useAuth();
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const createPropertyMutation = useCreateProperty();
  const updatePropertyMutation = useUpdateProperty();

  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: 'apartment',
      bhk_type: '2BHK',
      status: 'available',
      city: 'Bangalore',
      state: 'Karnataka',
    },
  });

  const watchedType = watch('type');
  const watchedPriceMin = watch('price_min');
  const watchedPriceMax = watch('price_max');

  // Clear BHK type when property type doesn't support it
  React.useEffect(() => {
    if (watchedType && !['apartment', 'villa'].includes(watchedType)) {
      setValue('bhk_type', undefined);
    }
  }, [watchedType, setValue]);

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const addImage = () => {
    if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (image: string) => {
    setImages(images.filter(img => img !== image));
  };

  const onSubmit = async (data: PropertyFormData) => {
    console.log('Form data submitted:', data);
    console.log('Form errors:', errors);
    
    if (!currentCompany) {
      toast.error('No company selected');
      return;
    }

    if (data.price_min >= data.price_max) {
      toast.error('Minimum price must be less than maximum price');
      return;
    }

    try {
      const propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'> = {
        company_id: currentCompany.id,
        title: data.title,
        description: data.description,
        type: data.type,
        sub_type: data.sub_type || null,
        bhk_type: data.bhk_type || null,
        area_sqft: data.area_sqft,
        area_sqmt: Math.round(data.area_sqft * 0.092903),
        price_min: data.price_min,
        price_max: data.price_max,
        price_per_sqft: Math.round((data.price_min + data.price_max) / 2 / data.area_sqft),
        status: data.status,
        location: {
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            country: 'India',
            postal_code: data.postal_code,
          },
          locality: data.locality,
          landmark: data.landmark || null,
          distance_from_metro: null,
          nearby_facilities: [],
        },
        amenities,
        images,
        documents: [],
        rera_number: data.rera_number || null,
        possession_date: data.possession_date || null,
        floor_details: null,
        parking_details: null,
        specifications: {},
      };

      if (isEditing) {
        await updatePropertyMutation.mutateAsync({ id: id!, ...propertyData });
      } else {
        await createPropertyMutation.mutateAsync(propertyData);
      }

      navigate('/properties');
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/properties')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Property' : 'Add New Property'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update property details' : 'Create a new property listing'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title *
                </label>
                <Input
                  {...register('title')}
                  placeholder="e.g., Prestige Lakeside Habitat - 2BHK"
                  error={errors.title?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="office">Office</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Type
                </label>
                <Input
                  {...register('sub_type')}
                  placeholder="e.g., Luxury Apartment, Independent Villa"
                />
              </div>
              
              {(watchedType === 'apartment' || watchedType === 'villa') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BHK Type
                  </label>
                  <select
                    {...register('bhk_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select BHK Type</option>
                    <option value="1RK">1RK</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="5BHK+">5BHK+</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the property features, location advantages, etc."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <Input
                  {...register('street')}
                  placeholder="e.g., Whitefield Main Road"
                  error={errors.street?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locality *
                </label>
                <Input
                  {...register('locality')}
                  placeholder="e.g., Whitefield, Electronic City"
                  error={errors.locality?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  {...register('city')}
                  placeholder="e.g., Bangalore"
                  error={errors.city?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <Input
                  {...register('state')}
                  placeholder="e.g., Karnataka"
                  error={errors.state?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <Input
                  {...register('postal_code')}
                  placeholder="e.g., 560066"
                  error={errors.postal_code?.message}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark
              </label>
              <Input
                {...register('landmark')}
                placeholder="e.g., Near ITPL, Opposite to Phoenix Mall"
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ruler className="h-5 w-5 mr-2" />
              Property Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sq ft) *
                </label>
                <Input
                  type="number"
                  {...register('area_sqft')}
                  placeholder="e.g., 1200"
                  error={errors.area_sqft?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="under_construction">Under Construction</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RERA Number
                </label>
                <Input
                  {...register('rera_number')}
                  placeholder="e.g., PRM/KA/RERA/1251/446/PR/171120/002054"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Possession Date
                </label>
                <Input
                  type="date"
                  {...register('possession_date')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pricing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Price (₹) *
                </label>
                <Input
                  type="number"
                  {...register('price_min')}
                  placeholder="e.g., 7500000"
                  error={errors.price_min?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price (₹) *
                </label>
                <Input
                  type="number"
                  {...register('price_max')}
                  placeholder="e.g., 8500000"
                  error={errors.price_max?.message}
                />
              </div>
            </div>

            {watchedPriceMin && watchedPriceMax && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  Price Range: ₹{(watchedPriceMin / 100000).toFixed(1)}L - ₹{(watchedPriceMax / 100000).toFixed(1)}L
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Amenities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity (e.g., Swimming Pool, Gym)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity} variant="outline">
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Property Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Add image URL"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <Button type="button" onClick={addImage} variant="outline">
                Add Image
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Property ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/properties')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </form>
    </div>
  );
};