import { MetadataRoute } from 'next';
import { sanityClient } from './sanity';

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
}

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const locales = ['fr', 'en', 'ar'];
  
  const staticPages = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/services',
      priority: 0.9,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/portfolio',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/about',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/contact',
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/blog',
      priority: 0.6,
      changeFrequency: 'daily' as const,
    },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Add static pages for each locale
  staticPages.forEach((page) => {
    locales.forEach((locale) => {
      const url = locale === 'fr' 
        ? `${baseUrl}${page.path}` 
        : `${baseUrl}/${locale}${page.path}`;
      
      const alternates: Record<string, string> = {};
      locales.forEach((altLocale) => {
        if (altLocale !== locale) {
          alternates[altLocale] = altLocale === 'fr' 
            ? `${baseUrl}${page.path}` 
            : `${baseUrl}/${altLocale}${page.path}`;
        }
      });

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: alternates,
        },
      });
    });
  });

  try {
    // Add dynamic content from CMS
    const [properties, services, blogPosts] = await Promise.all([
      // Fetch properties
      sanityClient.fetch(`
        *[_type == "property" && !(_id in path("drafts.**"))] {
          slug,
          _updatedAt
        }
      `),
      // Fetch services
      sanityClient.fetch(`
        *[_type == "service" && !(_id in path("drafts.**"))] {
          slug,
          _updatedAt
        }
      `),
      // Fetch blog posts
      sanityClient.fetch(`
        *[_type == "post" && !(_id in path("drafts.**"))] {
          slug,
          _updatedAt
        }
      `),
    ]);

    // Add property pages
    properties?.forEach((property: any) => {
      locales.forEach((locale) => {
        const url = locale === 'fr' 
          ? `${baseUrl}/portfolio/${property.slug.current}` 
          : `${baseUrl}/${locale}/portfolio/${property.slug.current}`;
        
        const alternates: Record<string, string> = {};
        locales.forEach((altLocale) => {
          if (altLocale !== locale) {
            alternates[altLocale] = altLocale === 'fr' 
              ? `${baseUrl}/portfolio/${property.slug.current}` 
              : `${baseUrl}/${altLocale}/portfolio/${property.slug.current}`;
          }
        });

        sitemap.push({
          url,
          lastModified: new Date(property._updatedAt),
          changeFrequency: 'monthly',
          priority: 0.8,
          alternates: {
            languages: alternates,
          },
        });
      });
    });

    // Add service pages
    services?.forEach((service: any) => {
      locales.forEach((locale) => {
        const url = locale === 'fr' 
          ? `${baseUrl}/services/${service.slug.current}` 
          : `${baseUrl}/${locale}/services/${service.slug.current}`;
        
        const alternates: Record<string, string> = {};
        locales.forEach((altLocale) => {
          if (altLocale !== locale) {
            alternates[altLocale] = altLocale === 'fr' 
              ? `${baseUrl}/services/${service.slug.current}` 
              : `${baseUrl}/${altLocale}/services/${service.slug.current}`;
          }
        });

        sitemap.push({
          url,
          lastModified: new Date(service._updatedAt),
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: {
            languages: alternates,
          },
        });
      });
    });

    // Add blog post pages
    blogPosts?.forEach((post: any) => {
      locales.forEach((locale) => {
        const url = locale === 'fr' 
          ? `${baseUrl}/blog/${post.slug.current}` 
          : `${baseUrl}/${locale}/blog/${post.slug.current}`;
        
        const alternates: Record<string, string> = {};
        locales.forEach((altLocale) => {
          if (altLocale !== locale) {
            alternates[altLocale] = altLocale === 'fr' 
              ? `${baseUrl}/blog/${post.slug.current}` 
              : `${baseUrl}/${altLocale}/blog/${post.slug.current}`;
          }
        });

        sitemap.push({
          url,
          lastModified: new Date(post._updatedAt),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages: alternates,
          },
        });
      });
    });
  } catch (error) {
    console.error('Error fetching dynamic content for sitemap:', error);
    // Continue with static pages only
  }

  return sitemap;
}

export function generateRobotsTxt(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /studio/
Disallow: /api/
Disallow: /_next/
Disallow: /private/

# Allow important assets
Allow: /images/
Allow: /icons/
Allow: /favicon.ico`;
}