'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Calendar, Users, Minus, Plus } from 'lucide-react';

interface SearchWidgetProps {
  locale: string;
  className?: string;
  onSearch?: (searchData: SearchData) => void;
}

interface SearchData {
  location: string;
  dateRange: DateRange | undefined;
  guests: number;
}

/**
 * Integrated search widget for immediate booking
 * Features location selector with Algerian cities, date range picker, and guest counter
 */
export default function SearchWidget({ locale, className, onSearch }: SearchWidgetProps) {
  const [location, setLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState<number>(2);

  // Multilingual content
  const content = {
    fr: {
      locationPlaceholder: "Choisir une destination",
      datePlaceholder: "Dates de séjour",
      guestsLabel: "Voyageurs",
      searchButton: "Rechercher",
      cities: {
        alger: "Alger",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        blida: "Blida",
        batna: "Batna",
        djelfa: "Djelfa",
        setif: "Sétif",
        sidi_bel_abbes: "Sidi Bel Abbès",
        biskra: "Biskra",
        tebessa: "Tébessa",
        el_oued: "El Oued",
        skikda: "Skikda",
        tiaret: "Tiaret",
        bejaia: "Béjaïa",
        tlemcen: "Tlemcen",
        ouargla: "Ouargla",
        mostaganem: "Mostaganem",
        bordj_bou_arreridj: "Bordj Bou Arréridj",
        chlef: "Chlef"
      }
    },
    en: {
      locationPlaceholder: "Choose a destination",
      datePlaceholder: "Stay dates",
      guestsLabel: "Guests",
      searchButton: "Search",
      cities: {
        alger: "Algiers",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        blida: "Blida",
        batna: "Batna",
        djelfa: "Djelfa",
        setif: "Setif",
        sidi_bel_abbes: "Sidi Bel Abbes",
        biskra: "Biskra",
        tebessa: "Tebessa",
        el_oued: "El Oued",
        skikda: "Skikda",
        tiaret: "Tiaret",
        bejaia: "Bejaia",
        tlemcen: "Tlemcen",
        ouargla: "Ouargla",
        mostaganem: "Mostaganem",
        bordj_bou_arreridj: "Bordj Bou Arreridj",
        chlef: "Chlef"
      }
    },
    ar: {
      locationPlaceholder: "اختر وجهة",
      datePlaceholder: "تواريخ الإقامة",
      guestsLabel: "الضيوف",
      searchButton: "بحث",
      cities: {
        alger: "الجزائر",
        oran: "وهران",
        constantine: "قسنطينة",
        annaba: "عنابة",
        blida: "البليدة",
        batna: "باتنة",
        djelfa: "الجلفة",
        setif: "سطيف",
        sidi_bel_abbes: "سيدي بلعباس",
        biskra: "بسكرة",
        tebessa: "تبسة",
        el_oued: "الوادي",
        skikda: "سكيكدة",
        tiaret: "تيارت",
        bejaia: "بجاية",
        tlemcen: "تلمسان",
        ouargla: "ورقلة",
        mostaganem: "مستغانم",
        bordj_bou_arreridj: "برج بوعريريج",
        chlef: "الشلف"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const handleSearch = () => {
    const searchData: SearchData = {
      location,
      dateRange,
      guests
    };
    
    onSearch?.(searchData);
    
    // For now, just log the search data
    console.log('Search initiated:', searchData);
  };

  const incrementGuests = () => {
    if (guests < 10) setGuests(guests + 1);
  };

  const decrementGuests = () => {
    if (guests > 1) setGuests(guests - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20 ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        {/* Location Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Destination
          </label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
              <SelectValue placeholder={text.locationPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(text.cities).map(([key, city]) => (
                <SelectItem key={key} value={key}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {text.datePlaceholder}
          </label>
          <div className="h-12">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full"
            />
          </div>
        </div>

        {/* Guest Counter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {text.guestsLabel}
          </label>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md h-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementGuests}
              disabled={guests <= 1}
              className="h-full px-3 hover:bg-gray-200"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="flex-1 text-center font-medium">{guests}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementGuests}
              disabled={guests >= 10}
              className="h-full px-3 hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Button */}
        <div className="space-y-2">
          <div className="h-6" /> {/* Spacer for alignment */}
          <Button
            onClick={handleSearch}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            disabled={!location || !dateRange?.from}
          >
            <Search className="w-5 h-5 mr-2" />
            {text.searchButton}
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Recherches populaires:</span>
          {['alger', 'oran', 'constantine'].map((cityKey) => (
            <Button
              key={cityKey}
              variant="outline"
              size="sm"
              onClick={() => setLocation(cityKey)}
              className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border-gray-200"
            >
              {text.cities[cityKey as keyof typeof text.cities]}
            </Button>
          ))}
        </div>
      </div>

      {/* Availability Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>Disponibilité en temps réel</span>
      </div>
    </motion.div>
  );
}