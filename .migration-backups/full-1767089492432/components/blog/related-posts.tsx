'use client';

import { useTranslations } from 'next-intl';
import { BlogCard } from './blog-card';
import { BlogPost } from '@/lib/services/blog-service';

interface RelatedPostsProps {
  posts: BlogPost[];
  locale: string;
}

export function RelatedPosts({ posts, locale }: RelatedPostsProps) {
  const t = useTranslations('blog');

  if (posts.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{t('relatedPosts')}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </section>
  );
}