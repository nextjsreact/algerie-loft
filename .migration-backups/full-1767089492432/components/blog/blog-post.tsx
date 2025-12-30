'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, UserIcon, TagIcon } from 'lucide-react';
import { BlogPost as BlogPostType } from '@/lib/services/blog-service';
import { formatDate } from '@/lib/utils';
import { PortableText } from '@portabletext/react';
import { SocialShare } from './social-share';
import { CommentSystem } from './comment-system';

interface BlogPostProps {
  post: BlogPostType;
  locale: string;
  enableComments?: boolean;
}

// Portable Text components for rich content rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => (
      <div className="my-8">
        <Image
          src={value.asset.url}
          alt={value.alt || ''}
          width={800}
          height={400}
          className="rounded-lg w-full h-auto"
        />
        {value.caption && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            {value.caption}
          </p>
        )}
      </div>
    ),
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
    ),
    normal: ({ children }: any) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="ml-4">{children}</li>,
    number: ({ children }: any) => <li className="ml-4">{children}</li>,
  },
};

export function BlogPost({ post, locale, enableComments = false }: BlogPostProps) {
  const t = useTranslations('blog');
  
  const title = post.title[locale] || post.title.fr || post.title.en;
  const content = post.content[locale] || post.content.fr || post.content.en;
  const imageAlt = post.featuredImage?.alt?.[locale] || title;
  const authorBio = post.author?.bio?.[locale] || post.author?.bio?.fr || post.author?.bio?.en;
  const tags = post.tags?.[locale] || post.tags?.fr || post.tags?.en || [];

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map((category) => (
            <Badge key={category} variant="secondary">
              {t(`categories.${category}`, { fallback: category })}
            </Badge>
          ))}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
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

        {/* Social Share */}
        <SocialShare
          title={title}
          url={typeof window !== 'undefined' ? window.location.href : ''}
          locale={locale}
        />
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="mb-8">
          <Image
            src={post.featuredImage.url}
            alt={imageAlt}
            width={post.featuredImage.width}
            height={post.featuredImage.height}
            className="rounded-lg w-full h-auto"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        {content && <PortableText value={content} components={portableTextComponents} />}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-8">
          <Separator className="mb-4" />
          <div className="flex items-center gap-2 flex-wrap">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('tags')}:
            </span>
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Author Bio */}
      {post.author && (
        <div className="border-t pt-8">
          <div className="flex items-start gap-4">
            {post.author.avatar && (
              <Image
                src={post.author.avatar.url}
                alt={post.author.avatar.alt || post.author.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <h3 className="font-semibold mb-2">{post.author.name}</h3>
              {authorBio && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {authorBio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment System */}
      <CommentSystem 
        postId={post.id} 
        locale={locale} 
        enabled={enableComments} 
      />
    </article>
  );
}