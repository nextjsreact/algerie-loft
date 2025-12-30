'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BlogCard } from './blog-card';
import { BlogFilters } from './blog-filters';
import { BlogPagination } from './blog-pagination';
import { BlogPost } from '@/lib/services/blog-service';

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
  tags: Record<string, string[]>;
  currentPage: number;
  totalPages: number;
  selectedCategory?: string;
  selectedTag?: string;
  locale: string;
}

export function BlogList({
  posts,
  categories,
  tags,
  currentPage,
  totalPages,
  selectedCategory,
  selectedTag,
  locale,
}: BlogListProps) {
  const t = useTranslations('blog');
  const [isLoading, setIsLoading] = useState(false);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">{t('noPosts')}</h3>
        <p className="text-muted-foreground">{t('noPostsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <BlogFilters
        categories={categories}
        tags={tags[locale] || []}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        locale={locale}
        onFilterChange={() => setIsLoading(true)}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading')}</p>
        </div>
      )}

      {/* Posts grid */}
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${isLoading ? 'opacity-50' : ''}`}>
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} locale={locale} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <BlogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          locale={locale}
        />
      )}
    </div>
  );
}