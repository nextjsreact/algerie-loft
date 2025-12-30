# Blog System Implementation

This directory contains the complete blog system implementation for the public website, including CMS integration, content features, and optional commenting system.

## Components

### Core Components
- **`blog-list.tsx`** - Main blog listing page with filtering and pagination
- **`blog-card.tsx`** - Individual blog post card component
- **`blog-post.tsx`** - Full blog post display with rich content
- **`blog-filters.tsx`** - Category and tag filtering interface
- **`blog-pagination.tsx`** - Pagination controls for blog listing

### Content Features
- **`social-share.tsx`** - Social media sharing buttons
- **`related-posts.tsx`** - Related posts suggestions based on categories and tags
- **`comment-system.tsx`** - Optional comment system with moderation
- **`blog-navigation.tsx`** - Navigation breadcrumbs and back buttons

## Features Implemented

### ✅ Task 8.1: Blog System with CMS Integration
- **Blog listing page** with pagination (12 posts per page)
- **Individual blog post pages** with rich content rendering
- **Categories and tags functionality** with filtering
- **Sanity CMS integration** for content management
- **Multi-language support** (French, English, Arabic)
- **SEO optimization** with meta tags and structured data

### ✅ Task 8.2: Blog Content Features
- **Social sharing buttons** (Facebook, Twitter, LinkedIn, native share)
- **Related posts suggestions** based on categories and tags with relevance scoring
- **Optional comment system** with moderation workflow
- **Enhanced navigation** with breadcrumbs and back buttons

## Configuration

### Environment Variables
```env
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token

# Optional: Enable comments
NEXT_PUBLIC_BLOG_COMMENTS_ENABLED=false
```

### CMS Schema
The blog system uses a comprehensive Sanity schema (`public-website/src/sanity/schemas/blogPost.ts`) with:
- Multi-language content (fr, en, ar)
- Rich text content with images
- Categories and tags
- Author information with bio and avatar
- SEO fields
- Publication status and scheduling

## Usage

### Basic Blog Listing
```tsx
import { BlogList } from '@/components/blog/blog-list';
import { getBlogPosts } from '@/lib/services/blog-service';

const { posts, totalPages, categories, tags } = await getBlogPosts({
  locale: 'fr',
  page: 1,
  limit: 12,
});
```

### Individual Blog Post
```tsx
import { BlogPost } from '@/components/blog/blog-post';
import { getBlogPost } from '@/lib/services/blog-service';

const post = await getBlogPost(slug, locale);

<BlogPost 
  post={post} 
  locale={locale} 
  enableComments={true} // Optional
/>
```

## API Routes

### Comment System
- **POST** `/api/blog/comments` - Submit new comment
- **GET** `/api/blog/comments?postId=xxx` - Fetch approved comments

## Translations

All text content is fully internationalized with support for:
- **French** (`messages/fr.json`)
- **English** (`messages/en.json`) 
- **Arabic** (`messages/ar.json`)

Translation keys are organized under the `blog` namespace:
- `blog.title`, `blog.subtitle`
- `blog.categories.*`
- `blog.filters.*`
- `blog.pagination.*`
- `blog.share.*`
- `blog.comments.*`

## Styling

The blog system uses:
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Lucide React** icons
- **Responsive design** for all screen sizes
- **Dark mode support** (inherited from theme)

## Performance Features

- **Image optimization** with Next.js Image component
- **Lazy loading** for better performance
- **Caching** with Sanity CDN
- **Pagination** to limit data fetching
- **SEO optimization** with proper meta tags

## Accessibility

- **Keyboard navigation** support
- **Screen reader** friendly
- **ARIA labels** and semantic HTML
- **Color contrast** compliance
- **Focus management**

## Future Enhancements

The system is designed to be extensible with:
- Newsletter subscription integration
- Advanced search functionality
- Comment threading and replies
- Social media auto-posting
- Analytics integration
- RSS feed generation