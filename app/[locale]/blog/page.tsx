import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog/blog-list';
import { BlogNavigation } from '@/components/blog/blog-navigation';
import { getBlogPosts } from '@/lib/services/blog-service';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { page = '1', category, tag } = await searchParams;
  
  const currentPage = parseInt(page, 10);
  const postsPerPage = 12;
  
  const { posts, totalPages, categories, tags } = await getBlogPosts({
    locale,
    page: currentPage,
    limit: postsPerPage,
    category,
    tag,
  });

  const t = await getTranslations({ locale, namespace: 'blog' });

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogNavigation locale={locale} showBackToHome={true} />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <BlogList
        posts={posts}
        categories={categories}
        tags={tags}
        currentPage={currentPage}
        totalPages={totalPages}
        selectedCategory={category}
        selectedTag={tag}
        locale={locale}
      />
    </div>
  );
}