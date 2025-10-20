'use client';

import { useState } from 'react';

interface FilterOptions {
  type: string[];
  location: string[];
  priceRange: string[];
  features: string[];
}

interface ActiveFilters {
  type: string;
  location: string;
  priceRange: string;
  features: string[];
  search: string;
}

interface PortfolioFiltersProps {
  options: FilterOptions;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  resultsCount: number;
}

export function PortfolioFilters({
  options,
  activeFilters,
  onFiltersChange,
  resultsCount
}: PortfolioFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ActiveFilters, value: any) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = activeFilters.features.includes(feature)
      ? activeFilters.features.filter(f => f !== feature)
      : [...activeFilters.features, feature];
    
    handleFilterChange('features', newFeatures);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: '',
      location: '',
      priceRange: '',
      features: [],
      search: ''
    });
  };

  const hasActiveFilters = 
    activeFilters.type || 
    activeFilters.location || 
    activeFilters.priceRange || 
    activeFilters.features.length > 0 || 
    activeFilters.search;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      {/* Header avec recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une propriété..."
              value={activeFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">🔧</span>
          Filtres avancés
          <span className="ml-2">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Résultats et actions rapides */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="text-gray-600">
          <span className="font-semibold text-blue-600">{resultsCount}</span> propriétés trouvées
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            ✕ Effacer tous les filtres
          </button>
        )}
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2 mb-4">
        {options.type.map(type => (
          <button
            key={type}
            onClick={() => handleFilterChange('type', activeFilters.type === type ? '' : type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilters.type === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Filtres avancés */}
      {isExpanded && (
        <div className="border-t pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <select
                value={activeFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les localisations</option>
                {options.location.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Gamme de prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gamme de prix
              </label>
              <select
                value={activeFilters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les prix</option>
                {options.priceRange.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="newest">Plus récent</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="area-desc">Surface décroissante</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
          </div>

          {/* Caractéristiques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Caractéristiques
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {options.features.map(feature => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="border-t pt-4 mt-4">
          <div className="text-sm text-gray-600 mb-2">Filtres actifs :</div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.type && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Type: {activeFilters.type}
                <button
                  onClick={() => handleFilterChange('type', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            )}
            
            {activeFilters.location && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Lieu: {activeFilters.location}
                <button
                  onClick={() => handleFilterChange('location', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            )}
            
            {activeFilters.priceRange && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Prix: {activeFilters.priceRange}
                <button
                  onClick={() => handleFilterChange('priceRange', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            )}
            
            {activeFilters.features.map(feature => (
              <span key={feature} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                {feature}
                <button
                  onClick={() => handleFeatureToggle(feature)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            ))}
            
            {activeFilters.search && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Recherche: "{activeFilters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}