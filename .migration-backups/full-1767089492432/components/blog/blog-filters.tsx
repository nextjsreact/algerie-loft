'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface BlogFiltersProps {
  categories: string[];
  tags: string[];
  selectedCategory?: string;
  selectedTag?: string;
  locale: string;
  onFilterChange?: () => void;
}

export function BlogFilters({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  locale,
  onFilterChange,
}: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('blog');

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to first page when filters change
    params.delete('page');
    
    onFilterChange?.();
    router.push(`/${locale}/blog?${params.toString()}`);
  };

  const clearAllFilters = () => {
    onFilterChange?.();
    router.push(`/${locale}/blog`);
  };

  const hasActiveFilters = selectedCategory || selectedTag;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Category Filter */}
        <div className="min-w-[200px]">
          <Select
            value={selectedCategory || ''}
            onValueChange={(value) => updateFilters('category', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('filters.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('filters.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(`categories.${category}`, { fallback: category })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        <div className="min-w-[200px]">
          <Select
            value={selectedTag || ''}
            onValueChange={(value) => updateFilters('tag', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('filters.selectTag')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('filters.allTags')}</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {t('filters.clearAll')}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t(`categories.${selectedCategory}`, { fallback: selectedCategory })}
              <button
                onClick={() => updateFilters('category', null)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedTag}
              <button
                onClick={() => updateFilters('tag', null)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}