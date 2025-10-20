import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Eye, Briefcase } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllServices } from '@/lib/sanity-queries'
import { getOptimizedImageUrl, getLocalizedContent, getLocalizedArray } from '@/lib/sanity-utils'

export const dynamic = 'force-dynamic'

export default async function ServicesAdmin() {
  const services = await getAllServices()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-gray-600">
              Manage your service offerings and descriptions
            </p>
          </div>
          <Link
            href="/studio/structure/service"
            target="_blank"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Link>
        </div>

        {/* Services List */}
        {services.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Briefcase className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first service offering.</p>
            <div className="mt-6">
              <Link
                href="/studio/structure/service"
                target="_blank"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {services.map((service) => {
              const title = getLocalizedContent(service.title, 'fr')
              const description = getLocalizedContent(service.description, 'fr')
              const features = getLocalizedArray(service.features, 'fr')
              const imageUrl = service.image 
                ? getOptimizedImageUrl(service.image, { width: 400, height: 200, quality: 80 })
                : null

              return (
                <div key={service._id} className="group relative rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    {/* Image */}
                    <div className="w-32 h-32 relative bg-gray-100 flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Briefcase className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title}
                          </h3>
                          
                          {description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {description}
                            </p>
                          )}

                          {/* Features */}
                          {Array.isArray(features) && features.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {features.slice(0, 3).map((feature, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                                  >
                                    {feature}
                                  </span>
                                ))}
                                {features.length > 3 && (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                    +{features.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status and Order */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              service.isActive 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span>Order: {service.order}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 flex flex-col space-y-1">
                          <Link
                            href={`/studio/structure/service;${service._id}`}
                            target="_blank"
                            className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/services/${service.slug.current}`}
                            target="_blank"
                            className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
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