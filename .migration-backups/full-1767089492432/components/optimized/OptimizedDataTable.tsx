'use client';

import React from 'react';
import { useVirtualPagination, useDebounce } from '@/lib/performance/lazy-loading';
import { useCachedData, createCacheKey } from '@/lib/performance/cache-manager';
import { PAGINATION_CONFIG, DEBOUNCE_CONFIG } from '@/lib/performance/optimization-config';

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  searchable?: boolean;
  pageSize?: number;
  className?: string;
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
  className = ''
}: OptimizedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_CONFIG.SEARCH_DELAY);

  // Filtrage optimisé avec cache
  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm) return data;

    return data.filter(item =>
      columns.some(column =>
        String(item[column.key])
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [data, debouncedSearchTerm, columns]);

  // Pagination virtuelle
  const { visibleItems, loadMore, hasMore } = useVirtualPagination(
    filteredData,
    pageSize
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche */}
      {searchable && (
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Tableau optimisé */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bouton "Charger plus" */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Charger plus ({filteredData.length - visibleItems.length} restants)
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="text-sm text-gray-500 text-center">
        Affichage de {visibleItems.length} sur {filteredData.length} éléments
        {debouncedSearchTerm && ` (filtré de ${data.length} total)`}
      </div>
    </div>
  );
}