'use client'

import { useState } from 'react';

interface SearchBarProps {
  locale: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ locale, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const text = {
    fr: {
      placeholder: "Rechercher une propriété...",
      search: "Rechercher"
    },
    en: {
      placeholder: "Search for a property...",
      search: "Search"
    },
    ar: {
      placeholder: "البحث عن عقار...",
      search: "بحث"
    }
  };

  const t = text[locale as keyof typeof text] || text.fr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        🔍 {t.search}
      </button>
    </form>
  );
}