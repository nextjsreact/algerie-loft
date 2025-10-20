import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Eye, Calendar, User } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllBlogPosts } from '@/lib/sanity-queries'
import { getOptimizedImageUrl, getLocalizedContent, formatDate } from '@/lib/sanity-utils'

export const dynamic = 'force-dynamic'

export default async function BlogAdmin() {
  const { items: blogPosts } = await getAllBlogPosts({ limit: 50 })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <p className="mt-2 text-gray-600">
              Manage your blog content and articles
            </p>
          </div>
          <Link
            href="/studio/structure/blogPost"
            target="_blank"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Write Post
          </Link>
        </div>

        {/* Blog Posts List */}
        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by writing your first blog post.</p>
            <div className="mt-6">
              <Link
                href="/studio/structure/blogPost"
                target="_blank"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Write Post
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post) => {
              const title = getLocalizedContent(post.title, 'fr')
              const excerpt = getLocalizedContent(post.excerpt, 'fr')
              const imageUrl = post.featuredImage 
                ? getOptimizedImageUrl(post.featuredImage, { width: 200, height: 120, quality: 80 })
                : null

              return (
                <div key={post._id} className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    {/* Featured Image */}
                    <div className="w-32 h-20 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title}
                          </h3>
                          
                          {excerpt && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {excerpt}
                            </p>
                          )}

                          {/* Meta Information */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(post.publishedAt, 'fr')}
                            </div>
                            {post.author?.name && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {post.author.name}
                              </div>
                            )}
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              post.isPublished 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          {/* Categories */}
                          {post.categories && post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.categories.slice(0, 3).map((category) => (
                                <span
                                  key={category}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                                >
                                  {category.replace('-', ' ')}
                                </span>
                              ))}
                              {post.categories.length > 3 && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                  +{post.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="ml-4 flex space-x-2">
                          <Link
                            href={`/studio/structure/blogPost;${post._id}`}
                            target="_blank"
                            className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          {post.isPublished && (
                            <Link
                              href={`/blog/${post.slug.current}`}
                              target="_blank"
                              className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}