import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Eye, MapPin } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllProperties } from '@/lib/sanity-queries'
import { getOptimizedImageUrl, getLocalizedContent } from '@/lib/sanity-utils'

export const dynamic = 'force-dynamic'

export default async function PropertiesAdmin() {
  const { items: properties } = await getAllProperties({ limit: 50 })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="mt-2 text-gray-600">
              Manage your property portfolio and showcase listings
            </p>
          </div>
          <Link
            href="/studio/structure/property"
            target="_blank"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first property listing.</p>
            <div className="mt-6">
              <Link
                href="/studio/structure/property"
                target="_blank"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const title = getLocalizedContent(property.title, 'fr')
              const description = getLocalizedContent(property.description, 'fr')
              const imageUrl = property.images?.[0] 
                ? getOptimizedImageUrl(property.images[0], { width: 400, height: 300, quality: 80 })
                : null

              return (
                <div key={property._id} className="group relative rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="aspect-video relative bg-gray-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        property.status === 'featured' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : property.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Link
                          href={`/studio/structure/property;${property._id}`}
                          target="_blank"
                          className="rounded-full bg-white p-1.5 text-gray-600 hover:text-gray-900 shadow-sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/portfolio/${property.slug.current}`}
                          target="_blank"
                          className="rounded-full bg-white p-1.5 text-gray-600 hover:text-gray-900 shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {title}
                    </h3>
                    
                    {property.location?.city && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location.city}
                      </div>
                    )}

                    {description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {description}
                      </p>
                    )}

                    {/* Property Details */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="capitalize">{property.type}</span>
                      {property.specifications?.bedrooms && (
                        <span>{property.specifications.bedrooms} bed</span>
                      )}
                      {property.specifications?.area && (
                        <span>{property.specifications.area}m²</span>
                      )}
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