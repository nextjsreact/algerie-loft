import { createClient } from '@sanity/client';

// Sanity client configuration
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN,
});

export interface BlogPost {
  id: string;
  title: Record<string, string>;
  slug: {
    current: string;
  };
  excerpt?: Record<string, string>;
  content: Record<string, any>;
  featuredImage?: {
    url: string;
    alt?: Record<string, string>;
    width: number;
    height: number;
  };
  categories: string[];
  tags?: Record<string, string[]>;
  author?: {
    name: string;
    bio?: Record<string, string>;
    avatar?: {
      url: string;
      alt?: string;
    };
  };
  publishedAt: string;
  isPublished: boolean;
  seo?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
  };
}

export interface BlogListResponse {
  posts: BlogPost[];
  totalPages: number;
  categories: string[];
  tags: Record<string, string[]>;
}

export async function getBlogPosts({
  locale,
  page = 1,
  limit = 12,
  category,
  tag,
}: {
  locale: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
}): Promise<BlogListResponse> {
  try {
    // Build filter conditions
    let filter = '*[_type == "blogPost" && isPublished == true]';
    
    if (category) {
      filter = `*[_type == "blogPost" && isPublished == true && "${category}" in categories]`;
    }
    
    if (tag) {
      filter = `*[_type == "blogPost" && isPublished == true && "${tag}" in tags.${locale}]`;
    }

    // Get total count for pagination
    const totalQuery = `count(${filter})`;
    const total = await client.fetch(totalQuery);
    const totalPages = Math.ceil(total / limit);

    // Get posts with pagination
    const offset = (page - 1) * limit;
    const postsQuery = `
      ${filter} | order(publishedAt desc) [${offset}...${offset + limit}] {
        "id": _id,
        title,
        slug,
        excerpt,
        featuredImage {
          "url": asset->url,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height,
          alt
        },
        categories,
        tags,
        author,
        publishedAt,
        isPublished
      }
    `;

    const posts = await client.fetch(postsQuery);

    // Get all categories and tags for filtering
    const categoriesQuery = `
      array::unique(*[_type == "blogPost" && isPublished == true].categories[])
    `;
    const categories = await client.fetch(categoriesQuery);

    const tagsQuery = `
      *[_type == "blogPost" && isPublished == true].tags.${locale}[]
    `;
    const allTags = await client.fetch(tagsQuery);
    const tags = { [locale]: [...new Set(allTags.flat())] };

    return {
      posts,
      totalPages,
      categories,
      tags,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      posts: [],
      totalPages: 0,
      categories: [],
      tags: { [locale]: [] },
    };
  }
}

export async function getBlogPost(slug: string, locale: string): Promise<BlogPost | null> {
  try {
    const query = `
      *[_type == "blogPost" && slug.current == $slug && isPublished == true][0] {
        "id": _id,
        title,
        slug,
        excerpt,
        content,
        featuredImage {
          "url": asset->url,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height,
          alt
        },
        categories,
        tags,
        author {
          name,
          bio,
          avatar {
            "url": asset->url,
            "alt": alt
          }
        },
        publishedAt,
        isPublished,
        seo
      }
    `;

    const post = await client.fetch(query, { slug });
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function getRelatedPosts(
  currentPostId: string,
  locale: string,
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    // Get current post categories and tags to find related posts
    const currentPostQuery = `
      *[_type == "blogPost" && _id == $currentPostId][0] {
        categories,
        tags
      }
    `;
    const currentPost = await client.fetch(currentPostQuery, { currentPostId });
    
    if (!currentPost) {
      return [];
    }

    const currentCategories = currentPost.categories || [];
    const currentTags = currentPost.tags?.[locale] || [];

    // Find posts with similar categories or tags, prioritizing by relevance
    const relatedQuery = `
      *[_type == "blogPost" && 
        isPublished == true && 
        _id != $currentPostId && 
        (count(categories[@ in $categories]) > 0 || count(tags.${locale}[@ in $tags]) > 0)
      ] | order(
        count(categories[@ in $categories]) desc,
        count(tags.${locale}[@ in $tags]) desc,
        publishedAt desc
      ) [0...${limit}] {
        "id": _id,
        title,
        slug,
        excerpt,
        featuredImage {
          "url": asset->url,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height,
          alt
        },
        categories,
        tags,
        publishedAt,
        "relevanceScore": count(categories[@ in $categories]) + count(tags.${locale}[@ in $tags])
      }
    `;

    const relatedPosts = await client.fetch(relatedQuery, {
      currentPostId,
      categories: currentCategories,
      tags: currentTags,
    });

    return relatedPosts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

// Helper function to get all categories
export async function getAllCategories(): Promise<string[]> {
  try {
    const query = `
      array::unique(*[_type == "blogPost" && isPublished == true].categories[])
    `;
    return await client.fetch(query);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper function to get all tags for a locale
export async function getAllTags(locale: string): Promise<string[]> {
  try {
    const query = `
      array::unique(*[_type == "blogPost" && isPublished == true].tags.${locale}[])
    `;
    const tags = await client.fetch(query);
    return tags.filter(Boolean);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}