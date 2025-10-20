import Link from 'next/link'
import { Plus, Edit, Eye, Calendar, Globe } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllPages } from '@/lib/sanity-queries'
import { getLocalizedContent, formatDate, getAvailableLocales } from '@/lib/sanity-utils'

export const dynamic = 'force-dynamic'

export default async function PagesAdmin() {
  const pages = await getAllPages()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="mt-2 text-gray-600">
              Manage your website pages and content
            </p>
          </div>
          <Link
            href="/studio/structure/page"
            target="_blank"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Link>
        </div>

        {/* Pages List */}
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pages</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first page.</p>
            <div className="mt-6">
              <Link
                href="/studio/structure/page"
                target="_blank"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {pages.map((page) => {
                const title = getLocalizedContent(page.title, 'fr')
                const availableLocales = getAvailableLocales(page.title)

                return (
                  <li key={page._id}>
                    <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {title}
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(page.publishedAt, 'fr')}
                              </div>
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-1" />
                                <span>/{page.slug.current}</span>
                              </div>
                            </div>
                          </div>

                          {/* Language indicators */}
                          <div className="flex items-center space-x-2 mr-4">
                            {['fr', 'en', 'ar'].map((locale) => (
                              <span
                                key={locale}
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  availableLocales.includes(locale as any)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {locale.toUpperCase()}
                              </span>
                            ))}
                          </div>

                          {/* Status */}
                          <div className="mr-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              page.isPublished 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {page.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <Link
                              href={`/studio/structure/page;${page._id}`}
                              target="_blank"
                              className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {page.isPublished && (
                              <Link
                                href={`/${page.slug.current}`}
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
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}