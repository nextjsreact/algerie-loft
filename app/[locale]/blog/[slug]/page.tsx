import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BlogPost } from '@/components/blog/blog-post';
import { BlogNavigation } from '@/components/blog/blog-navigation';
import { RelatedPosts } from '@/components/blog/related-posts';
import { getBlogPost, getRelatedPosts } from '@/lib/services/blog-service';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  try {
    const post = await getBlogPost(slug, locale);
    
    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    const title = post.seo?.title?.[locale] || post.title[locale];
    const description = post.seo?.description?.[locale] || post.excerpt?.[locale];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: post.publishedAt,
        authors: [post.author?.name || 'Loft Algérie'],
        images: post.featuredImage ? [
          {
            url: post.featuredImage.url,
            width: post.featuredImage.width,
            height: post.featuredImage.height,
            alt: post.featuredImage.alt?.[locale] || post.title[locale],
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: post.featuredImage ? [post.featuredImage.url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Post Not Found',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  
  try {
    const post = await getBlogPost(slug, locale);
    
    if (!post || !post.isPublished) {
      notFound();
    }

    const relatedPosts = await getRelatedPosts(post.id, locale, 3);

    // Check if comments are enabled (you can control this via environment variable or CMS setting)
    const commentsEnabled = process.env.NEXT_PUBLIC_BLOG_COMMENTS_ENABLED === 'true';

    return (
      <div className="container mx-auto px-4 py-8">
        <BlogNavigation locale={locale} showBackToBlog={true} />
        
        <BlogPost 
          post={post} 
          locale={locale} 
          enableComments={commentsEnabled}
        />
        
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <RelatedPosts posts={relatedPosts} locale={locale} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading blog post:', error);
    notFound();
  }
}