'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, UserIcon } from 'lucide-react';
import { BlogPost } from '@/lib/services/blog-service';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  post: BlogPost;
  locale: string;
}

export function BlogCard({ post, locale }: BlogCardProps) {
  const t = useTranslations('blog');
  
  const title = post.title[locale] || post.title.fr || post.title.en;
  const excerpt = post.excerpt?.[locale] || post.excerpt?.fr || post.excerpt?.en;
  const imageAlt = post.featuredImage?.alt?.[locale] || title;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={post.featuredImage.url}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <CardHeader className="flex-1">
        <div className="flex flex-wrap gap-2 mb-2">
          {post.categories.slice(0, 2).map((category) => (
            <Badge key={category} variant="secondary" className="text-xs">
              {t(`categories.${category}`, { fallback: category })}
            </Badge>
          ))}
        </div>
        
        <h3 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
          <Link href={`/${locale}/blog/${post.slug.current}`}>
            {title}
          </Link>
        </h3>
      </CardHeader>

      <CardContent className="flex-1">
        {excerpt && (
          <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <time dateTime={post.publishedAt}>
              {formatDate(new Date(post.publishedAt), locale)}
            </time>
          </div>
          
          {post.author?.name && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}