'use client';

import { useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useAnalytics } from '@/components/analytics/google-analytics';

interface Property {
  id: string;
  title: string;
  type: 'appartement' | 'villa' | 'studio' | 'loft' | 'maison';
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  price: number;
  currency: 'DZD' | 'EUR';
  images: string[];
  features: string[];
  description: string;
  status: 'available' | 'occupied' | 'maintenance';
  rating: number;
  reviews: number;
  revenue: {
    monthly: number;
    annual: number;
    occupancyRate: number;
  };
}

interface PropertyCardProps {
  property: Property;
  variant?: 'grid' | 'list' | 'featured';
  showRevenue?: boolean;
}

export function PropertyCard({ 
  property, 
  variant = 'grid', 
  showRevenue = false 
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { trackClick } = useAnalytics();

  const handlePropertyClick = () => {
    trackClick('property_view', `${property.type}_${property.id}`);
  };

  const handleImageNavigation = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'prev') {
      setCurrentImageIndex(prev => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex(prev => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Property['status']) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupé';
      case 'maintenance': return 'Maintenance';
      default: return 'Inconnu';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency === 'DZD' ? 'DZD' : 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (variant === 'list') {
    return (
      <div 
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={handlePropertyClick}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/3 h-64 md:h-auto">
            <OptimizedImage
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
              priority={false}
            />
            
            {property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => handleImageNavigation('prev', e)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  ←
                </button>
                <button
                  onClick={(e) => handleImageNavigation('next', e)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  →
                </button>
              </>
            )}
            
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(property.status)}`}>
                {getStatusText(property.status)}
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                <p className="text-gray-600 flex items-center">
                  <span className="mr-1">📍</span>
                  {property.location}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(property.price, property.currency)}
                </div>
                <div className="text-sm text-gray-500">par mois</div>
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{property.description}</p>

            {/* Caractéristiques */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <span className="mr-1">🏠</span>
                <span>{property.area}m²</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-1">🛏️</span>
                <span>{property.bedrooms} chambres</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-1">🚿</span>
                <span>{property.bathrooms} SDB</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-1">👥</span>
                <span>{property.capacity} personnes</span>
              </div>
            </div>

            {/* Revenue (si activé) */}
            {showRevenue && (
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <div className="text-sm text-green-600 font-semibold mb-1">Performance</div>
                <div className="flex justify-between text-sm">
                  <span>Revenus annuels: <strong>{formatPrice(property.revenue.annual, property.currency)}</strong></span>
                  <span>Taux d'occupation: <strong>{property.revenue.occupancyRate}%</strong></span>
                </div>
              </div>
            )}

            {/* Rating et actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {'⭐'.repeat(Math.floor(property.rating))}
                </div>
                <span className="text-sm text-gray-600">
                  {property.rating} ({property.reviews} avis)
                </span>
              </div>
              
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Voir détails
                </button>
                <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  Contacter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant grid (par défaut)
  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={handlePropertyClick}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <OptimizedImage
          src={property.images[currentImageIndex]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        
        {property.images.length > 1 && (
          <>
            <button
              onClick={(e) => handleImageNavigation('prev', e)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
            >
              ←
            </button>
            <button
              onClick={(e) => handleImageNavigation('next', e)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
            >
              →
            </button>
            
            {/* Indicateurs */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {property.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(property.status)}`}>
            {getStatusText(property.status)}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {property.images.length} photos
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{property.title}</h3>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">
              {formatPrice(property.price, property.currency)}
            </div>
            <div className="text-xs text-gray-500">par mois</div>
          </div>
        </div>

        <p className="text-gray-600 flex items-center mb-3">
          <span className="mr-1">📍</span>
          {property.location}
        </p>

        {/* Caractéristiques */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="mr-1">🏠</span>
            <span>{property.area}m²</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">🛏️</span>
            <span>{property.bedrooms} ch.</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">🚿</span>
            <span>{property.bathrooms} SDB</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">👥</span>
            <span>{property.capacity} pers.</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {property.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
              {feature}
            </span>
          ))}
          {property.features.length > 3 && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
              +{property.features.length - 3} autres
            </span>
          )}
        </div>

        {/* Revenue (si activé) */}
        {showRevenue && (
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <div className="text-xs text-green-600 font-semibold mb-1">Performance</div>
            <div className="text-sm">
              <div>Revenus: <strong>{formatPrice(property.revenue.annual, property.currency)}/an</strong></div>
              <div>Occupation: <strong>{property.revenue.occupancyRate}%</strong></div>
            </div>
          </div>
        )}

        {/* Rating et actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex text-yellow-400 text-sm mr-1">
              {'⭐'.repeat(Math.floor(property.rating))}
            </div>
            <span className="text-xs text-gray-600">
              {property.rating} ({property.reviews})
            </span>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
}