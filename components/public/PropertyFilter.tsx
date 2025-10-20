'use client'

import { useState } from 'react';

interface PropertyFilterProps {
  locale: string;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  type: string;
  location: string;
}

export default function PropertyFilter({ locale, onFilterChange }: PropertyFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    location: 'all'
  });

  const content = {
    fr: {
      filterBy: "Filtrer par",
      type: "Type de propriété",
      location: "Localisation",
      all: "Tous",
      types: {
        apartment: "Appartement",
        villa: "Villa", 
        studio: "Studio"
      },
      locations: {
        centre: "Alger Centre",
        hydra: "Hydra",
        bab_ezzouar: "Bab Ezzouar"
      }
    },
    en: {
      filterBy: "Filter by",
      type: "Property Type",
      location: "Location",
      all: "All",
      types: {
        apartment: "Apartment",
        villa: "Villa",
        studio: "Studio"
      },
      locations: {
        centre: "Algiers Center",
        hydra: "Hydra", 
        bab_ezzouar: "Bab Ezzouar"
      }
    },
    ar: {
      filterBy: "تصفية حسب",
      type: "نوع العقار",
      location: "الموقع",
      all: "الكل",
      types: {
        apartment: "شقة",
        villa: "فيلا",
        studio: "استوديو"
      },
      locations: {
        centre: "وسط الجزائر",
        hydra: "حيدرة",
        bab_ezzouar: "باب الزوار"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {text.filterBy}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {text.type}
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{text.all}</option>
            <option value="apartment">{text.types.apartment}</option>
            <option value="villa">{text.types.villa}</option>
            <option value="studio">{text.types.studio}</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {text.location}
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{text.all}</option>
            <option value="centre">{text.locations.centre}</option>
            <option value="hydra">{text.locations.hydra}</option>
            <option value="bab_ezzouar">{text.locations.bab_ezzouar}</option>
          </select>
        </div>
      </div>
    </div>
  );
}