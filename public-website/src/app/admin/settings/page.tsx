import Link from 'next/link'
import { Settings, ExternalLink, Globe, Mail, Phone, Share2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getSiteSettings } from '@/lib/sanity-queries'
import { getLocalizedContent } from '@/lib/sanity-utils'

export const dynamic = 'force-dynamic'

export default async function SettingsAdmin() {
  const siteSettings = await getSiteSettings()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your website configuration and global settings
            </p>
          </div>
          <Link
            href="/studio/structure/siteSettings"
            target="_blank"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Edit in Studio
          </Link>
        </div>

        {/* Settings Overview */}
        {!siteSettings ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Settings className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No site settings configured</h3>
            <p className="mt-1 text-sm text-gray-500">Set up your site configuration to get started.</p>
            <div className="mt-6">
              <Link
                href="/studio/structure/siteSettings"
                target="_blank"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configure Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Site Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Globe className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Site Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Site Title</label>
                  <p className="text-sm text-gray-900">
                    {getLocalizedContent(siteSettings.title, 'fr') || 'Not configured'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-600">
                    {getLocalizedContent(siteSettings.description, 'fr') || 'Not configured'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Mail className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="space-y-3">
                {siteSettings.contactInfo?.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{siteSettings.contactInfo.email}</p>
                  </div>
                )}
                {siteSettings.contactInfo?.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{siteSettings.contactInfo.phone}</p>
                  </div>
                )}
                {siteSettings.contactInfo?.whatsapp && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                    <p className="text-sm text-gray-900">{siteSettings.contactInfo.whatsapp}</p>
                  </div>
                )}
                {siteSettings.contactInfo?.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-600">
                      {getLocalizedContent(siteSettings.contactInfo.address, 'fr') || 'Not configured'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Share2 className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
              </div>
              <div className="space-y-3">
                {siteSettings.socialLinks ? (
                  <>
                    {siteSettings.socialLinks.facebook && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Facebook</label>
                        <p className="text-sm text-gray-900">{siteSettings.socialLinks.facebook}</p>
                      </div>
                    )}
                    {siteSettings.socialLinks.instagram && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Instagram</label>
                        <p className="text-sm text-gray-900">{siteSettings.socialLinks.instagram}</p>
                      </div>
                    )}
                    {siteSettings.socialLinks.linkedin && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                        <p className="text-sm text-gray-900">{siteSettings.socialLinks.linkedin}</p>
                      </div>
                    )}
                    {siteSettings.socialLinks.youtube && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">YouTube</label>
                        <p className="text-sm text-gray-900">{siteSettings.socialLinks.youtube}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No social media links configured</p>
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Settings className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Analytics & Tracking</h2>
              </div>
              <div className="space-y-3">
                {siteSettings.analytics ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Google Analytics</label>
                      <p className="text-sm text-gray-900">
                        {siteSettings.analytics.googleAnalyticsId || 'Not configured'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Google Tag Manager</label>
                      <p className="text-sm text-gray-900">
                        {siteSettings.analytics.gtmId || 'Not configured'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Facebook Pixel</label>
                      <p className="text-sm text-gray-900">
                        {siteSettings.analytics.facebookPixelId || 'Not configured'}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No analytics configured</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/studio/structure/siteSettings"
              target="_blank"
              className="flex items-center p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <Settings className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Edit Site Settings</p>
                <p className="text-xs text-blue-700">Configure global settings</p>
              </div>
            </Link>
            <Link
              href="/studio/structure/page"
              target="_blank"
              className="flex items-center p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <Globe className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Manage Pages</p>
                <p className="text-xs text-blue-700">Create and edit pages</p>
              </div>
            </Link>
            <Link
              href="/studio"
              target="_blank"
              className="flex items-center p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Open Studio</p>
                <p className="text-xs text-blue-700">Full content management</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}